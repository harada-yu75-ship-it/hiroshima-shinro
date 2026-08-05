import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const verified = searchParams.get('verified') === 'true'

  const { data, error } = await supabase
    .from('events')
    .select(`*, schools (name, official_url)`)
    .eq('is_verified', verified)
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date')

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ events: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { error } = await supabase
    .from('events')
    .insert([body] as never)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const { id, action, data } = await request.json()

  if (action === 'approve') {
    const { error } = await supabase.rpc('approve_event', { event_id: id })
    if (error) {
      const { error: err2 } = await supabase
        .from('events')
        .update({ is_verified: true } as never)
        .eq('id', id)
      if (err2) return NextResponse.json({ error: err2 }, { status: 500 })
    }
  }

  if (action === 'update') {
    const { error } = await supabase
      .from('events')
      .update({ ...data, is_verified: true } as never)
      .eq('id', id)
    if (error) return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
