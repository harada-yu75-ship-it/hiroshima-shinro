import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { SAMPLE_SCHOOLS, SAMPLE_EVENTS } from '@/lib/sampleData'
import { isFutureOrToday } from '@/lib/utils'
import type { School, Event } from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const keyword = searchParams.get('q')

  let schools: School[] = []
  let events: Event[] = []
  let usingFallback = false

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase not configured')
    }

    const { data: schoolData, error: schoolErr } = await supabase
      .from('schools')
      .select('*')
      .eq('crawl_enabled', true)
      .order('name')

    if (schoolErr) throw schoolErr
    schools = schoolData ?? []

    const { data: eventData, error: eventErr } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date')

    if (eventErr) throw eventErr
    events = eventData ?? []

  } catch (err) {
    console.error('Supabase error:', err)
    schools = SAMPLE_SCHOOLS
    events = SAMPLE_EVENTS.filter(e => isFutureOrToday(e.event_date))
    usingFallback = true
  }

  if (type && type !== 'all') {
    schools = schools.filter(s => s.school_type === type)
  }
  if (keyword) {
    schools = schools.filter(s =>
      s.name.includes(keyword) || (s.name_kana ?? '').includes(keyword.toLowerCase())
    )
  }

  const schoolIds = new Set(schools.map(s => s.id))
  const eventsBySchool: Record<string, Event[]> = {}
  for (const e of events) {
    if (!schoolIds.has(e.school_id)) continue
    if (!eventsBySchool[e.school_id]) eventsBySchool[e.school_id] = []
    eventsBySchool[e.school_id].push(e)
  }

  const result = schools
    .filter(s => (eventsBySchool[s.id]?.length ?? 0) > 0)
    .map(s => ({ ...s, events: eventsBySchool[s.id] }))

  return NextResponse.json({ schools: result, total: result.length, usingFallback })
}