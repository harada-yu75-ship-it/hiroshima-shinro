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

  // 未確認イベントの中に「更新候補」（update_target_id が設定されているもの）が
  // 含まれる場合、比較表示のために元の承認済みイベントも一緒に返す
  const events = data ?? []
  if (!verified) {
    const targetIds = Array.from(
      new Set(
        events
          .map((e: any) => e.update_target_id)
          .filter((id: any) => !!id)
      )
    )
    if (targetIds.length > 0) {
      const { data: targets, error: targetErr } = await supabase
        .from('events')
        .select('*')
        .in('id', targetIds)
      if (!targetErr && targets) {
        const targetMap = Object.fromEntries(targets.map((t: any) => [t.id, t]))
        for (const e of events as any[]) {
          if (e.update_target_id && targetMap[e.update_target_id]) {
            e.update_target = targetMap[e.update_target_id]
          }
        }
      }
    }
  }

  return NextResponse.json({ events })
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
    const { error } = await (supabase.rpc as never as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ error: unknown }>)('approve_event', { event_id: id })
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

  if (action === 'apply_update') {
    // 更新候補(id)の内容を、紐付け先の承認済みイベント(update_target_id)へ反映する
    const { data: candidate, error: fetchErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchErr || !candidate) {
      return NextResponse.json({ error: fetchErr ?? '更新候補が見つかりません' }, { status: 500 })
    }
    const c = candidate as any
    if (!c.update_target_id) {
      return NextResponse.json({ error: 'この行は更新候補ではありません' }, { status: 400 })
    }

    const { error: updateErr } = await supabase
      .from('events')
      .update({
        event_name: data?.event_name ?? c.event_name,
        event_time: data?.event_time ?? c.event_time,
        requires_application: data?.requires_application ?? c.requires_application,
        capacity: data?.capacity ?? c.capacity,
        notes: data?.notes ?? c.notes,
        application_deadline: data?.application_deadline ?? c.application_deadline,
        application_url: data?.application_url ?? c.application_url,
        source_url: c.source_url,
      } as never)
      .eq('id', c.update_target_id)
    if (updateErr) return NextResponse.json({ error: updateErr }, { status: 500 })

    const { error: deleteErr } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    if (deleteErr) return NextResponse.json({ error: deleteErr }, { status: 500 })
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
