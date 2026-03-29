/// 学校種別
export type SchoolType = 'high' | 'tsushin' | 'senmon'

// タブフィルター種別
export type SchoolFilter = 'all' | 'high_public' | 'high_private' | 'tsushin' | 'senmon'

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
  source_url: string
  is_verified: boolean
  crawled_at: string
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
}

// 中学校
export interface MiddleSchool {
  id: string
  name: string
  address: string
  lat: number
  lng: number
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
        Insert: Omit<School, 'id' | 'created_at'>
        Update: Partial<Omit<School, 'id' | 'created_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id'>
        Update: Partial<Omit<Event, 'id'>>
      }
      middle_schools: {
        Row: MiddleSchool
        Insert: Omit<MiddleSchool, 'id'>
        Update: Partial<Omit<MiddleSchool, 'id'>>
      }
    }
  }
}
