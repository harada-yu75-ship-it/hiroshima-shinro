-- =====================================================
-- 広島市進路情報サイト - Supabase DB セットアップSQL
-- Supabase ダッシュボード → SQL Editor で実行してください
-- =====================================================

-- 学校種別のENUM型
CREATE TYPE school_type AS ENUM ('high', 'tsushin', 'senmon');

-- ── 高等学校等マスタ ────────────────────────────────────────
CREATE TABLE schools (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  name_kana        TEXT,
  school_type      school_type NOT NULL,
  address          TEXT NOT NULL,
  lat              FLOAT8 NOT NULL,
  lng              FLOAT8 NOT NULL,
  official_url     TEXT NOT NULL,
  crawl_urls       TEXT[] NOT NULL DEFAULT '{}',
  crawl_enabled    BOOLEAN NOT NULL DEFAULT true,
  last_crawled_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 中学校マスタ ─────────────────────────────────────────────
CREATE TABLE middle_schools (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name     TEXT NOT NULL,
  address  TEXT NOT NULL,
  lat      FLOAT8 NOT NULL,
  lng      FLOAT8 NOT NULL
);

-- ── イベントデータ ────────────────────────────────────────────
CREATE TABLE events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id             UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  event_name            TEXT NOT NULL,
  event_date            DATE NOT NULL,
  event_time            TEXT,
  requires_application  BOOLEAN,
  capacity              INTEGER,
  notes                 TEXT,
  application_url       TEXT,
  source_url            TEXT NOT NULL,
  is_verified           BOOLEAN NOT NULL DEFAULT false,
  crawled_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── インデックス ──────────────────────────────────────────────
-- 日付検索の高速化（過去イベント除外に使用）
CREATE INDEX idx_events_date ON events(event_date);
-- 学校IDで絞り込み
CREATE INDEX idx_events_school_id ON events(school_id);
-- クロール対象取得の高速化
CREATE INDEX idx_schools_crawl_enabled ON schools(crawl_enabled);

-- ── Row Level Security (RLS) ─────────────────────────────────
-- 生徒向け: 全員が読み取り可能
ALTER TABLE schools        ENABLE ROW LEVEL SECURITY;
ALTER TABLE middle_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE events         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read schools"
  ON schools FOR SELECT USING (true);

CREATE POLICY "public read middle_schools"
  ON middle_schools FOR SELECT USING (true);

CREATE POLICY "public read events"
  ON events FOR SELECT USING (true);

-- 書き込みはサービスロールキーのみ（クローラー用）
-- Supabase ダッシュボードの「Service Role Key」を使用してください

-- =====================================================
-- サンプルデータ投入（開発・テスト用）
-- 本番環境では削除または上書きしてください
-- =====================================================

-- 中学校マスタ
INSERT INTO middle_schools (name, address, lat, lng) VALUES
  ('広島市立二葉中学校',   '広島市東区光町2丁目',       34.3975, 132.4685),
  ('広島市立段原中学校',   '広島市南区段原1丁目',       34.3826, 132.4783),
  ('広島市立翠町中学校',   '広島市南区翠4丁目',         34.3763, 132.4594),
  ('広島市立皆実中学校',   '広島市南区皆実町4丁目',     34.3711, 132.4752),
  ('広島市立舟入中学校',   '広島市中区舟入幸町',         34.3956, 132.4451),
  ('広島市立観音中学校',   '広島市西区観音新町4丁目',   34.3979, 132.4312),
  ('広島市立安佐南中学校', '広島市安佐南区古市1丁目',   34.4483, 132.4452),
  ('広島市立安西中学校',   '広島市安佐南区安西3丁目',   34.4312, 132.4387),
  ('広島市立己斐中学校',   '広島市西区己斐上3丁目',     34.4038, 132.4195),
  ('広島市立戸山中学校',   '広島市佐伯区五月が丘1丁目', 34.4154, 132.3998),
  ('広島市立五日市中学校', '広島市佐伯区五日市5丁目',   34.3656, 132.3519),
  ('広島市立可部中学校',   '広島市安佐北区可部3丁目',   34.5112, 132.5021),
  ('広島市立東野中学校',   '広島市安佐南区東野3丁目',   34.4267, 132.5134),
  ('広島市立高陽中学校',   '広島市安佐北区口田3丁目',   34.4721, 132.5213),
  ('広島市立庚午中学校',   '広島市西区庚午北3丁目',     34.3921, 132.4108);

-- 高等学校等マスタ（サンプル）
INSERT INTO schools (name, name_kana, school_type, address, lat, lng, official_url, crawl_urls) VALUES
  ('広島県立広島国泰寺高等学校', 'こくたいじ', 'high',
   '広島市中区国泰寺町1-4-1', 34.3918, 132.4538,
   'https://www.hiroshima-kokutaiji.hiroshima-c.ed.jp/',
   ARRAY['https://www.hiroshima-kokutaiji.hiroshima-c.ed.jp/']),

  ('広島県立広島皆実高等学校', 'みなみ', 'high',
   '広島市南区皆実町2-2-1', 34.3748, 132.4761,
   'https://www.hiroshima-minami.hiroshima-c.ed.jp/',
   ARRAY['https://www.hiroshima-minami.hiroshima-c.ed.jp/']),

  ('広島県立観音高等学校', 'かんおん', 'high',
   '広島市西区南観音6-1-1', 34.4014, 132.4289,
   'https://www.kanon.hiroshima-c.ed.jp/',
   ARRAY['https://www.kanon.hiroshima-c.ed.jp/']),

  ('広島市立広島商業高等学校', 'ひろしましょうぎょう', 'high',
   '広島市南区松川町13-1', 34.3784, 132.4892,
   'https://www.hc-hc.ed.jp/',
   ARRAY['https://www.hc-hc.ed.jp/']),

  ('広島県立基町高等学校', 'もとまち', 'high',
   '広島市中区基町20-11', 34.4038, 132.4577,
   'https://www.motomachi.hiroshima-c.ed.jp/',
   ARRAY['https://www.motomachi.hiroshima-c.ed.jp/']),

  ('N高等学校（広島キャンパス）', 'えぬこう', 'tsushin',
   '広島市中区紙屋町2-2-2', 34.3889, 132.4558,
   'https://nnn.ed.jp/',
   ARRAY['https://nnn.ed.jp/school/campus/hiroshima/']),

  ('クラーク記念国際高等学校（広島）', 'くらーく', 'tsushin',
   '広島市中区銀山町3-1', 34.3972, 132.4631,
   'https://clark.ed.jp/',
   ARRAY['https://clark.ed.jp/']),

  ('広島デザイン専門学校', 'でざいんせんもんがっこう', 'senmon',
   '広島市中区鉄砲町8-18', 34.3889, 132.4612,
   'https://www.hds.ac.jp/',
   ARRAY['https://www.hds.ac.jp/']),

  ('広島情報専門学校', 'じょうほうせんもんがっこう', 'senmon',
   '広島市東区光町2-6-10', 34.3931, 132.4732,
   'https://www.hic.ac.jp/',
   ARRAY['https://www.hic.ac.jp/']);
