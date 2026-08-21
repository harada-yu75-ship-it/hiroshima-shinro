import os
import json
import time
import random
import hashlib
import requests
import io
from bs4 import BeautifulSoup
from anthropic import Anthropic
from supabase import create_client
from dotenv import load_dotenv
from datetime import date, datetime, timezone

try:
    import pdfplumber
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
SUPABASE_URL      = os.getenv("SUPABASE_URL")
SUPABASE_KEY      = os.getenv("SUPABASE_KEY")

anthropic = Anthropic(api_key=ANTHROPIC_API_KEY)
supabase  = create_client(SUPABASE_URL, SUPABASE_KEY)

MAX_TEXT_LENGTH = 15000
CRAWL_DELAY_MIN = 15
CRAWL_DELAY_MAX = 30

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

PDF_KEYWORDS = ["オープンスクール", "入試", "説明会", "体験", "見学", "募集", "進学", "受験"]

SYSTEM_PROMPT = (
    "あなたは学校Webサイトからオープンスクール・学校説明会等の情報を抽出するエージェントです。\n"
    "以下のテキストから、中学生向けのイベント情報を全て抽出し、JSON配列のみで返してください。\n"
    "返却形式(JSON配列のみ、前後に説明文不要):\n"
    '[{"event_name":"名前","event_date":"YYYY-MM-DD","event_time":"時間","requires_application":true,"capacity":null,"notes":"備考","application_deadline":"YYYY-MM-DDまたはnull","application_url":"URLまたはnull"}]\n'
    "【除外ルール】以下は抽出しない:\n"
    "・過去のイベント\n"
    "・日程が未定・後日掲載・調整中のイベント\n"
    "・申込方法や詳細が『後日案内』『現在調整中』と明記されているイベント\n"
    "・中学生以外向けのイベント\n"
    "・日程が不明なイベント\n"
    "・見つからない場合は[]\n"
    "【日付・時間の精度】\n"
    "・日付は必ずYYYY-MM-DD形式。複数日程がある場合は1件ずつ別々のオブジェクトで返す\n"
    "・『第○回』などの回数表記がある場合、event_nameに正確に含める\n"
    "・開始時間と終了時間が両方ある場合、event_timeは『HH:MM〜HH:MM』形式で正確に記載\n"
    "・『受付開始』と『開始時間』が別に記載されている場合、開始時間（受付時間ではない）をevent_timeに記載\n"
    "requires_applicationの判定ルール:\n"
    "・「申込不要」「予約不要」と明記されている場合のみfalse\n"
    "・「申込については随時掲載」「申込方法は後日案内」「先着〇名」「定員〇名」などの表記はtrue\n"
    "・不明な場合はtrue\n"
    "capacityは「先着〇名」「定員〇名」など人数の記載があれば数値で、なければnull。\n"
    "application_deadlineは申込締切日。ページに記載がなければnull。締切日を過ぎている場合もnullではなく正確な日付を記載する。\n"
    "application_urlは申込フォームや申込ページへの直接URL。記載がなければnull。\n"
    "現在は2026年です。令和7年=2025年、令和8年=2026年として日付を変換してください。"
)


def make_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()


def record_error(school_id: str, error_msg: str):
    try:
        result = supabase.table("schools").select("crawl_error_count").eq("id", school_id).execute()
        current_count = result.data[0].get("crawl_error_count", 0) if result.data else 0
        supabase.table("schools").update({
            "crawl_error": error_msg[:500],
            "crawl_error_count": current_count + 1,
            "last_crawled_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", school_id).execute()
        print(f"  ⚠️ エラーをDBに記録 (連続{current_count + 1}回)")
    except Exception as e:
        print(f"  エラー記録失敗: {e}")


def clear_error(school_id: str):
    try:
        supabase.table("schools").update({
            "crawl_error": None,
            "crawl_error_count": 0,
        }).eq("id", school_id).execute()
    except Exception as e:
        print(f"  エラーリセット失敗: {e}")


def fetch_pdf(url):
    try:
        print("  PDFダウンロード中: " + url)
        resp = requests.get(url, headers=HEADERS, timeout=30, verify=False)
        resp.raise_for_status()
        if PDF_AVAILABLE:
            with pdfplumber.open(io.BytesIO(resp.content)) as pdf:
                text = ""
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            if len(text) > MAX_TEXT_LENGTH:
                text = text[:MAX_TEXT_LENGTH]
            print("  PDF取得成功(" + str(len(text)) + "文字)")
            return text
        else:
            print("  pdfplumberが未インストールです")
            return None
    except Exception as e:
        print("  PDF取得失敗: " + str(e))
        return None


def fetch_html(url):
    try:
        print("  アクセス中: " + url)
        resp = requests.get(url, headers=HEADERS, timeout=15, verify=False)
        resp.raise_for_status()
        resp.encoding = resp.apparent_encoding
        soup = BeautifulSoup(resp.text, "html.parser")

        from urllib.parse import urljoin
        pdf_links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if not href.endswith(".pdf"):
                continue
            full_url = href if href.startswith("http") else urljoin(url, href)
            link_text = a.get_text(strip=True)
            # リンクテキストが空の場合はスキップ
            if not link_text:
                continue
            # リンクテキストかURLにキーワードが含まれる場合のみ追加
            combined = link_text + full_url
            if any(kw in combined for kw in PDF_KEYWORDS):
                pdf_links.append(full_url)

        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        lines = [l.strip() for l in soup.get_text(separator="\n", strip=True).splitlines() if l.strip()]
        text = "\n".join(lines)
        if len(text) > MAX_TEXT_LENGTH:
            text = text[:MAX_TEXT_LENGTH]
        print("  取得成功(" + str(len(text)) + "文字、PDFリンク" + str(len(pdf_links)) + "件)")
        return text, pdf_links
    except Exception as e:
        print("  取得失敗: " + str(e))
        return None, []


def fetch_page(url):
    if url.endswith(".pdf"):
        text = fetch_pdf(url)
        return text, []
    else:
        return fetch_html(url)


def extract_events_with_llm(text, school_name):
    try:
        print("  LLM解析中...")
        message = anthropic.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": "学校名:" + school_name + "\n\n" + text}]
        )
        raw = message.content[0].text.strip().replace("```json", "").replace("```", "").strip()
        events = json.loads(raw)
        print("  " + str(len(events)) + "件のイベントを抽出")
        return events
    except Exception as e:
        print("  LLMエラー: " + str(e))
        return []


# 差分比較の対象フィールド（左:クロール結果のキー / 右:DBのカラム名。今回は同名）
UPDATE_COMPARE_FIELDS = [
    "event_time",
    "requires_application",
    "application_deadline",
    "application_url",
    "notes",
]


def save_events(school_id, events, source_url):
    if not events:
        print("  保存するイベントなし")
        return
    try:
        today = date.today().isoformat()
        future = [e for e in events if e.get("event_date") and e.get("event_date") >= today]
        if not future:
            print("  今日以降のイベントなし")
            return

        # 未確認イベントは毎回洗い替え（更新候補も含めて、この回のクロール結果で作り直す）
        supabase.table("events").delete().eq("school_id", school_id).eq("is_verified", False).execute()

        # 承認済みイベントを日付ごとに取得（重複判定・差分比較・紐付けに使う）
        verified_res = supabase.table("events").select(
            "id, event_date, event_name, event_time, requires_application, "
            "application_deadline, application_url, notes"
        ).eq("school_id", school_id).eq("is_verified", True).execute()

        verified_by_date = {}
        for v in (verified_res.data or []):
            verified_by_date.setdefault(v["event_date"], []).append(v)

        rows = []
        update_count = 0

        for ev in future:
            ev_date = ev.get("event_date")
            candidates = verified_by_date.get(ev_date, [])

            base_row = {
                "school_id": school_id,
                "event_name": ev.get("event_name", ""),
                "event_date": ev_date,
                "event_time": ev.get("event_time"),
                "requires_application": ev.get("requires_application"),
                "capacity": ev.get("capacity"),
                "notes": ev.get("notes"),
                "application_deadline": ev.get("application_deadline"),
                "application_url": ev.get("application_url"),
                "source_url": source_url,
                "is_verified": False,
                "update_target_id": None,
            }

            if not candidates:
                # 承認済みと重複しない → 通常の新規未確認イベント
                rows.append(base_row)
                continue

            # 承認済みと同日 → 差分があれば「更新候補」として保存
            # 同日に複数の承認済みイベントがある場合は先頭のものと比較する（限定的だが現状は十分）
            matched = candidates[0]
            has_diff = False
            for field in UPDATE_COMPARE_FIELDS:
                new_val = ev.get(field) or None
                old_val = matched.get(field) or None
                if new_val != old_val:
                    has_diff = True
                    break

            if not has_diff:
                print(f"  スキップ（承認済みと同一内容）: {ev_date} {ev.get('event_name')}")
                continue

            print(f"  更新候補として保存: {ev_date} {ev.get('event_name')}")
            base_row["update_target_id"] = matched["id"]
            rows.append(base_row)
            update_count += 1

        if rows:
            supabase.table("events").insert(rows).execute()

        print(f"  {len(rows)}件をSupabaseに保存（うち更新候補{update_count}件）")

        supabase.table("schools").update({
            "last_crawled_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", school_id).execute()
    except Exception as e:
        print("  Supabase保存エラー: " + str(e))


def crawl_school(school):
    print("\n" + "="*50)
    print("学校: " + school["name"])
    print("="*50)
    crawl_urls = school.get("crawl_urls", [])
    if not crawl_urls:
        print("  クロールURLが未設定です")
        return

    all_texts = []       # 全テキスト（HTML + PDF）
    html_texts = []      # HTMLテキストのみ（フォールバック用）
    has_success = False

    for url in crawl_urls:
        text, pdf_links = fetch_page(url)
        if text:
            has_success = True
            all_texts.append(text)
            html_texts.append(text)
            for pdf_url in pdf_links[:3]:
                delay = random.uniform(2, 4)
                time.sleep(delay)
                pdf_text = fetch_pdf(pdf_url)
                if pdf_text:
                    all_texts.append(pdf_text)
        else:
            error_msg = f"URL取得失敗: {url}"
            record_error(school["id"], error_msg)

        delay = random.uniform(CRAWL_DELAY_MIN, CRAWL_DELAY_MAX)
        print("  " + str(round(delay, 1)) + "秒待機...")
        time.sleep(delay)

    if not has_success:
        return

    combined_text = "\n\n---\n\n".join(all_texts)
    new_hash = make_hash(combined_text)
    old_hash = school.get("crawl_hash")

    if old_hash and old_hash == new_hash:
        print("  ✅ ページ内容に変化なし → LLMスキップ")
        clear_error(school["id"])
        supabase.table("schools").update({
            "last_crawled_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", school["id"]).execute()
        return

    print("  🔄 ページ内容が変化 → LLM解析実行")

    # まとめて1回のLLM呼び出し（コスト削減）
    if len(combined_text) <= MAX_TEXT_LENGTH:
        print("  （全テキストまとめて解析）")
        events = extract_events_with_llm(combined_text, school["name"])
    else:
        # 上限超え → HTMLテキストのみでフォールバック
        fallback_text = "\n\n---\n\n".join(html_texts)
        print(f"  ⚠️ テキスト合計が{len(combined_text)}文字で上限超え → HTMLのみでフォールバック解析")
        events = extract_events_with_llm(fallback_text[:MAX_TEXT_LENGTH], school["name"])

    supabase.table("schools").update({
        "crawl_hash": new_hash
    }).eq("id", school["id"]).execute()

    clear_error(school["id"])
    save_events(school["id"], events, crawl_urls[0])


def main():
    print("="*60)
    print("広島市進路情報サイト - クローラー起動")
    print("="*60)
    print("学校一覧を取得中...")
    result = supabase.table("schools").select("*").eq("crawl_enabled", True).execute()
    schools = result.data
    if not schools:
        print("学校データがありません。")
        return
    print(str(len(schools)) + "校が対象です")

    for i, school in enumerate(schools, 1):
        print("\n[" + str(i) + "/" + str(len(schools)) + "]", end="")
        crawl_school(school)

    print("\n" + "="*60)
    print("クロール完了！")
    print("="*60)

    error_schools = supabase.table("schools").select("name, crawl_error, crawl_error_count").gt("crawl_error_count", 0).execute()
    if error_schools.data:
        print("\n⚠️ エラーが発生している学校:")
        for s in error_schools.data:
            print(f"  [{s['crawl_error_count']}回] {s['name']}: {s['crawl_error']}")
    else:
        print("\n✅ エラーなし")


if __name__ == "__main__":
    main()
