import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

// ブラウザに読み込まれたら即座に気づけるようにする
if (typeof window !== 'undefined') {
  throw new Error(
    'supabaseAdmin はサーバー専用です。クライアントコンポーネントから import しないでください。'
  )
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY が設定されていません。')
}

// RLSを迂回できる強い権限のクライアント。API Route内でのみ使用する。
export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
