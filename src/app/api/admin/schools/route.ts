import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, official_url, crawl_urls, crawl_enabled, crawl_error, crawl_error_count, last_crawled_at')
    .order('name')
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ schools: data })
}

export async function PATCH(request: NextRequest) {
  const { id, crawl_urls, crawl_enabled } = await request.json()
  const updates: Record<string, unknown> = {}
  if (crawl_urls !== undefined) updates.crawl_urls = crawl_urls
  if (crawl_enabled !== undefined) updates.crawl_enabled = crawl_enabled
  // URL変更時はhashをリセットして次回クロールで必ず再解析
  if (crawl_urls !== undefined) updates.crawl_hash = null

  const { error } = await supabase
    .from('schools')
    .update(updates as never)
    .eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
