import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, official_url')
    .eq('crawl_enabled', true)
    .order('name')

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ schools: data })
}
