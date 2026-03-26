import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// シングルトンクライアント
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 接続確認用（開発時デバッグ用）
export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('schools').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}
