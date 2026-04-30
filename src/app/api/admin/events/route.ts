import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 未確認イベント一覧取得
export async function GET() {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      schools (name, official_url)
    `)
    .eq('is_verified', false)
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date')

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ events: data })
}

// 承認・修正
export async function PATCH(request: NextRequest) {
  const { id, action, data } = await request.json()

  if (action === 'approve') {
    const { error } = await supabase
      .from('events')
      .update({ is_verified: true } as any)
      .eq('id', id)
    if (error) return NextResponse.json({ error }, { status: 500 })
  }

  if (action === 'update') {
    const { error } = await supabase
      .from('events')
      .update({ ...data, is_verified: true } as any)
      .eq('id', id)
    if (error) return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// 削除
export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
