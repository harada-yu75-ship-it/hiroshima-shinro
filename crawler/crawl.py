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

SYSTEM_PROMPT = (
    "あなたは学校Webサイトからオープンスクール・学校説明会等の情報を抽出するエージェントです。\n"
    "以下のテキストから、中学生向けのイベント情報を全て抽出し、JSON配列のみで返してください。\n"
    "返却形式(JSON配列のみ、前後に説明文不要):\n"
    '[{"event_name":"名前","event_date":"YYYY-MM-DD","event_time":"時間","requires_application":true,"capacity":null,"notes":"備考","application_deadline":"YYYY-MM-DDまたはnull","application_url":"URLまたはnull"}]\n'
    "注意:過去イベント除外、日程不明除外、中学生以外向け除外、見つからない場合は[]\n"
    "application_deadlineは申込締切日。ページに記載がなければnull。\n"
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

        pdf_links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if href.endswith(".pdf"):
                if href.startswith("http"):
                    pdf_links.append(href)
                else:
                    from urllib.parse import urljoin
                    pdf_links.append(urljoin(url, href))

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
        supabase.table("events").delete().eq("school_id", school_id).eq("is_verified", False).execute()
        rows = []
        for ev in future:
            rows.append({
                "school_id": school_id,
                "event_name": ev.get("event_name", ""),
                "event_date": ev.get("event_date", ""),
                "event_time": ev.get("event_time"),
                "requires_application": ev.get("requires_application"),
                "capacity": ev.get("capacity"),
                "notes": ev.get("notes"),
                "application_deadline": ev.get("application_deadline"),
                "application_url": ev.get("application_url"),  # ← 追加
                "source_url": source_url,
                "is_verified": False
            })
        supabase.table("events").insert(rows).execute()
        print("  " + str(len(rows)) + "件をSupabaseに保存")
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

    all_events = []
    all_texts = []
    has_success = False

    for url in crawl_urls:
        text, pdf_links = fetch_page(url)
        if text:
            has_success = True
            all_texts.append(text)
            for pdf_url in pdf_links[:2]:
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

    combined_text = "\n".join(all_texts)
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

    for text in all_texts:
        events = extract_events_with_llm(text, school["name"])
        all_events.extend(events)

    supabase.table("schools").update({
        "crawl_hash": new_hash
    }).eq("id", school["id"]).execute()

    clear_error(school["id"])
    save_events(school["id"], all_events, crawl_urls[0])


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
