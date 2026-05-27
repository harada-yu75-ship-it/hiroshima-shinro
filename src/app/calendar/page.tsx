'use client'

import { useState, useEffect, useMemo } from 'react'
import Header from '@/components/Header'
import type { SchoolWithEvents } from '@/types'
import { isFutureOrToday } from '@/lib/utils'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

const TYPE_COLOR: Record<string, string> = {
  high_public:  '#C0392B',
  high_private: '#E67E22',
  tsushin:      '#5B4FCF',
  senmon:       '#A07020',
  senmon_kouto: '#2E8B57',
}

function getTypeKey(school: SchoolWithEvents): string {
  if (school.school_type === 'high') return school.is_public ? 'high_public' : 'high_private'
  if (school.school_type === 'tsushin') return 'tsushin'
  if (school.school_type === 'senmon_kouto') return 'senmon_kouto'
  return 'senmon'
}

interface CalendarEvent {
  school: SchoolWithEvents
  event_name: string
  event_date: string
  requires_application: boolean | null
}

export default function CalendarPage() {
  const [allSchools, setAllSchools] = useState<SchoolWithEvents[]>([])
  const [loading, setLoading] = useState(true)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/schools').then(r => r.json()).then(json => {
      setAllSchools(json.schools ?? [])
      setLoading(false)
    })
  }, [])

  // 全イベントをフラットに展開
  const allEvents = useMemo((): CalendarEvent[] => {
    const events: CalendarEvent[] = []
    for (const school of allSchools) {
      for (const ev of school.events) {
        if (isFutureOrToday(ev.event_date)) {
          events.push({
            school,
            event_name: ev.event_name,
            event_date: ev.event_date,
            requires_application: ev.requires_application,
          })
        }
      }
    }
    return events
  }, [allSchools])

  // 日付ごとにイベントをグループ化
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const ev of allEvents) {
      if (!map[ev.event_date]) map[ev.event_date] = []
      map[ev.event_date].push(ev)
    }
    return map
  }, [allEvents])

  // カレンダーの日付を生成
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const days: (number | null)[] = Array(firstDay).fill(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [currentYear, currentMonth])

  const formatDate = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${currentYear}-${m}-${d}`
  }

  const today = new Date().toISOString().split('T')[0]

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : []

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11) }
    else setCurrentMonth(m => m - 1)
    setSelectedDate(null)
  }

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0) }
    else setCurrentMonth(m => m + 1)
    setSelectedDate(null)
  }

  return (
    <>
      <Header />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', marginBottom: 4 }}>
            📅 イベントカレンダー
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            日付をクリックするとその日のイベントが表示されます
          </p>
        </div>

        {/* 凡例 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: '全日制（公立）', key: 'high_public' },
            { label: '全日制（私立）', key: 'high_private' },
            { label: '通信制', key: 'tsushin' },
            { label: '専門学校', key: 'senmon' },
            { label: '高等専修学校', key: 'senmon_kouto' },
          ].map(({ label, key }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: TYPE_COLOR[key] }} />
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* カレンダー本体 */}
        <div style={{
          background: 'white', borderRadius: 12,
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
          overflow: 'hidden', marginBottom: 20,
        }}>
          {/* ヘッダー */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            background: 'var(--navy)',
          }}>
            <button onClick={prevMonth} style={{
              background: 'rgba(255,255,255,.15)', border: 'none', color: 'white',
              borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 16,
            }}>←</button>
            <span style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>
              {currentYear}年 {currentMonth + 1}月
            </span>
            <button onClick={nextMonth} style={{
              background: 'rgba(255,255,255,.15)', border: 'none', color: 'white',
              borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 16,
            }}>→</button>
          </div>

          {/* 曜日ヘッダー */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {WEEKDAYS.map((w, i) => (
              <div key={w} style={{
                textAlign: 'center', padding: '8px 4px', fontSize: 12, fontWeight: 700,
                color: i === 0 ? '#DC2626' : i === 6 ? '#2563EB' : 'var(--text-muted)',
                borderBottom: '1px solid var(--border)',
                background: '#F8FAFC',
              }}>
                {w}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {calendarDays.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} style={{
                  minHeight: 80, borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)', background: '#FAFAFA',
                }} />
              }
              const dateStr = formatDate(day)
              const dayEvents = eventsByDate[dateStr] ?? []
              const isToday = dateStr === today
              const isSelected = dateStr === selectedDate
              const isPast = dateStr < today
              const dayOfWeek = i % 7

              return (
                <div
                  key={dateStr}
                  onClick={() => dayEvents.length > 0 && setSelectedDate(isSelected ? null : dateStr)}
                  style={{
                    minHeight: 80, padding: '6px 4px',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                    background: isSelected ? '#EFF6FF' : isToday ? '#FEF9C3' : 'white',
                    opacity: isPast ? 0.5 : 1,
                    transition: 'background .15s',
                  }}
                  onMouseOver={e => {
                    if (dayEvents.length > 0 && !isSelected) {
                      (e.currentTarget as HTMLDivElement).style.background = '#F0F7FF'
                    }
                  }}
                  onMouseOut={e => {
                    if (!isSelected && !isToday) {
                      (e.currentTarget as HTMLDivElement).style.background = 'white'
                    }
                  }}
                >
                  <div style={{
                    fontSize: 13, fontWeight: isToday ? 900 : 600, marginBottom: 3,
                    color: dayOfWeek === 0 ? '#DC2626' : dayOfWeek === 6 ? '#2563EB' : 'var(--navy)',
                    textAlign: 'center',
                  }}>
                    {isToday ? (
                      <span style={{
                        background: 'var(--navy)', color: 'white',
                        borderRadius: '50%', width: 22, height: 22,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12,
                      }}>{day}</span>
                    ) : day}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayEvents.slice(0, 3).map((ev, idx) => (
                      <div key={idx} style={{
                        height: 6, borderRadius: 3,
                        background: TYPE_COLOR[getTypeKey(ev.school)],
                      }} />
                    ))}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 選択日のイベント一覧 */}
        {selectedDate && (
          <div style={{
            background: 'white', borderRadius: 12,
            boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid var(--border)',
              background: '#F8FAFC', fontWeight: 700, fontSize: 14, color: 'var(--navy)',
            }}>
              📅 {selectedDate.replace(/-/g, '/')} のイベント（{selectedEvents.length}件）
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {selectedEvents.map((ev, i) => (
                <div key={i} style={{
                  padding: '12px 20px',
                  borderBottom: i < selectedEvents.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 4, height: 40, borderRadius: 2, flexShrink: 0,
                    background: TYPE_COLOR[getTypeKey(ev.school)],
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
                      {ev.school.name}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>
                      {ev.event_name}
                    </div>
                  </div>
                  {ev.requires_application !== null && (
                    <span style={{
                      background: ev.requires_application ? '#FEF7E0' : '#E8F5E9',
                      color: ev.requires_application ? '#A07020' : '#2E7D32',
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    }}>
                      {ev.requires_application ? '要申込' : '申込不要'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            読み込み中...
          </div>
        )}
      </div>
    </>
  )
}
