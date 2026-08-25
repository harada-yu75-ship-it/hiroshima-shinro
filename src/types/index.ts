// 学校種別
export type SchoolType = 'high' | 'tsushin' | 'senmon_kouto' | 'kosen'

// タブフィルター種別
export type SchoolFilter = 'all' | 'high_public' | 'high_private' | 'tsushin' | 'senmon_kouto' | 'kosen'

// 指摘の対応状況
export type ReportStatus = 'open' | 'resolved'

// イベント（DBから取得した生データ）
export interface Event {
  id: string
  school_id: string
  event_name: string
  event_date: string
  event_time: string | null
  requires_application: boolean | null
  capacity: number | null
  notes: string | null
  application_url: string | null
  application_deadline: string | null
  source_url: string
  is_verified: boolean
  crawled_at: string
  update_target_id: string | null
  is_manual: boolean
}

// 学校（DBから取得した生データ）
export interface School {
  id: string
  name: string
  name_kana: string | null
  school_type: SchoolType
  is_public: boolean
  address: string
  lat: number
  lng: number
  official_url: string
  crawl_urls: string[]
  crawl_enabled: boolean
  last_crawled_at: string | null
  created_at: string
  crawl_error: string | null
  crawl_error_count: number
  crawl_hash: string | null
}

// 中学校
export interface MiddleSchool {
  id: string
  name: string
  address: string
  lat: number
  lng: number
}

// 誤り・掲載漏れの指摘
export interface Report {
  id: string
  school_id: string | null
  school_name_text: string | null
  report_type: string
  description: string
  suggested_value: string | null
  suggested_values: Record<string, string> | null
  reporter_email: string
  reporter_name: string | null
  status: ReportStatus
  created_at: string | null
  resolved_at: string | null
  resolved_by: string | null
}

// フロントエンド表示用（距離付き学校＋イベント）
export interface SchoolWithEvents extends School {
  events: Event[]
  distanceKm: number | null
}

// フィルター状態
export interface FilterState {
  middleSchoolId: string
  distanceKm: number
  schoolFilter: SchoolFilter
  keyword: string
  sortBy: 'new' | 'date'
}

// Supabase DB型定義
export interface Database {
  public: {
    Tables: {
      schools: {
        Row: School
        Insert: Omit<School, 'id' | 'created_at' | 'crawl_error' | 'crawl_error_count' | 'crawl_hash'> &
          Partial<Pick<School, 'crawl_error' | 'crawl_error_count' | 'crawl_hash'>>
        Update: Partial<Omit<School, 'id' | 'created_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'crawled_at' | 'update_target_id' | 'is_manual'> &
          Partial<Pick<Event, 'update_target_id' | 'is_manual'>>
        Update: Partial<Omit<Event, 'id'>>
      }
      middle_schools: {
        Row: MiddleSchool
        Insert: Omit<MiddleSchool, 'id'>
        Update: Partial<Omit<MiddleSchool, 'id'>>
      }
      reports: {
        Row: Report
        Insert: Omit<Report, 'id' | 'created_at' | 'resolved_at' | 'resolved_by' | 'status'> &
          Partial<Pick<Report, 'created_at' | 'resolved_at' | 'resolved_by' | 'status'>>
        Update: Partial<Omit<Report, 'id'>>
      }
    }
  }
}
