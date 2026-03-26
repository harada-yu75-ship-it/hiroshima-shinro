# 広島市 進路情報サイト

広島県内の高等学校・通信制高校・専門学校のオープンスクール・学校説明会等、中学生向けイベント情報を集約・提供するWebサービスです。

---

## 機能

- 広島市内の中学校を起点に距離（5km / 10km / 15km / 20km）で学校を絞り込み
- 学校種別フィルター（全日制高校・通信制高校・専門学校）
- 学校名キーワード検索
- 過去のイベントは自動非表示
- 距離順・開催日順・学校名順のソート
- 学校詳細モーダル（全イベント・申込情報・公式サイトリンク）
- スケルトンローダー・スムーズアニメーション

---

## 技術スタック

| 用途 | 技術 |
|------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript |
| スタイリング | Tailwind CSS + インラインスタイル |
| データベース | Supabase (PostgreSQL) |
| ホスティング | Vercel |

---

## セットアップ手順

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. Supabase プロジェクトの作成

1. [https://supabase.com](https://supabase.com) にアクセスし、無料アカウントを作成
2. 新規プロジェクトを作成（リージョン：Northeast Asia (Tokyo) 推奨）
3. ダッシュボードの **SQL Editor** を開き、`supabase_setup.sql` の内容を貼り付けて実行

### 3. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を開き、Supabase ダッシュボードの **Settings → API** から以下をコピーして設定：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

> ⚠️ **Supabase 未設定時**: `.env.local` が未設定でもサンプルデータでデモ動作します。

---

## Vercel へのデプロイ

```bash
# Vercel CLI を使う場合
npm i -g vercel
vercel

# または GitHub リポジトリを Vercel に接続して自動デプロイ
```

Vercel ダッシュボードの **Settings → Environment Variables** に以下を設定：

| 変数名 | 値 |
|--------|----|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |

---

## プロジェクト構成

```
src/
├── app/
│   ├── layout.tsx          # ルートレイアウト（メタデータ設定）
│   ├── page.tsx            # メインページ（検索・一覧）
│   ├── globals.css         # グローバルCSS・デザイントークン
│   └── api/
│       ├── schools/        # 学校＋イベントAPI
│       └── middle-schools/ # 中学校一覧API
├── components/
│   ├── Header.tsx          # ヘッダー
│   ├── HeroSection.tsx     # ヒーローバナー
│   ├── SearchPanel.tsx     # 検索パネル（中学校・距離・キーワード）
│   ├── TypeFilterTabs.tsx  # 学校種別タブ
│   ├── SchoolCard.tsx      # 学校カード
│   ├── SchoolModal.tsx     # 学校詳細モーダル
│   └── SkeletonCard.tsx    # ローディングスケルトン
├── lib/
│   ├── supabase.ts         # Supabaseクライアント
│   ├── utils.ts            # ユーティリティ（Haversine・日付フォーマット等）
│   └── sampleData.ts       # デモ用サンプルデータ
└── types/
    └── index.ts            # TypeScript型定義
```

---

## フェーズ2以降の予定

- **クローラー実装**（Python + Playwright + Claude API）
  - 各学校公式サイトを1日1回クロール
  - LLMでイベント情報をJSON構造化抽出
  - GitHub Actions で定期実行

- **管理画面**
  - 学校マスタ・クロールURL管理
  - AI取得データの人的確認・修正

- **拡張機能**
  - 地図表示（Leaflet.js）
  - LINE通知
  - 印刷用PDF出力

---

## 開発メモ

- サンプルデータは `src/lib/sampleData.ts` を編集
- 中学校を追加する場合は `SAMPLE_MIDDLE_SCHOOLS` 配列と `supabase_setup.sql` の両方を更新
- Supabase に接続するとAPIルートが自動的に実データを使用します（サンプルデータへのフォールバックは無効化されます）
