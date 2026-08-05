import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

export async function GET() {
  const { data, error } = await supabase
    .from('reports')
    .select('*, schools(name)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ reports: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    school_id,
    school_name_text,
    report_type,
    description,
    suggested_value,
    reporter_email,
    reporter_name,
  } = body

  if (!report_type || !description || !reporter_email) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }

  const { error } = await supabase
    .from('reports')
    .insert([
      {
        school_id: school_id || null,
        school_name_text,
        report_type,
        description,
        suggested_value: suggested_value || null,
        reporter_email,
        reporter_name: reporter_name || null,
        status: 'open',
      },
    ] as never)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const { id, status } = await request.json()
  const updates: Record<string, unknown> = { status }
  if (status === 'resolved') {
    updates.resolved_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('reports')
    .update(updates as never)
    .eq('id', id)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
