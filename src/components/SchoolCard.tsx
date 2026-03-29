'use client'

import type { SchoolWithEvents } from '@/types'
import { formatDateJa, formatDistance } from '@/lib/utils'

interface Props {
  school: SchoolWithEvents
  animationDelay: number
  onClick: () => void
}

function getTypeConfig(school: SchoolWithEvents) {
  if (school.school_type === 'high') {
    return school.is_public
      ? { label: '全日制（公立）', bg: '#FDECEA', color: '#C0392B', accent: '#C0392B' }
      : { label: '全日制（私立）', bg: '#FEF0E6', color: '#E67E22', accent: '#E67E22' }
  }
  if (school.school_type === 'tsushin') {
    return { label: '通信制', bg: '#EDE9FF', color: '#5B4FCF', accent: '#7B68EE' }
  }
  return { label: '専門学校', bg: '#FEF7E0', color: '#A07020', accent: '#D4A843' }
}

export default function SchoolCard({ school, animationDelay, onClick }: Props) {
  const cfg = getTypeConfig(school)
  const futureEvents = school.events.slice(0, 2)
  const moreCount = school.events.length - 2

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      className="animate-fade-in-up"
      style={{
        background: 'white', borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
        overflow: 'hidden', cursor: 'pointer',
        transition: 'box-shadow .2s, transform .2s',
        animationDelay: `${animationDelay}ms`, outline: 'none',
      }}
      onMouseOver={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = 'var(--shadow-lg)'
        el.style.transform = 'translateY(-3px)'
      }}
      onMouseOut={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = 'var(--shadow-sm)'
        el.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ height: 4, background: cfg.accent }} />
      <div style={{ padding: '16px 18px 14px' }}>
        <span style={{
          display: 'inline-block', fontSize: 10, fontWeight: 700,
          letterSpacing: '.08em', padding: '2px 8px', borderRadius: 3,
          background: cfg.bg, color: cfg.color, marginBottom: 8,
        }}>
          {cfg.label}
        </span>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 3, lineHeight: 1.3 }}>
          {school.name}
        </div>
        {school.name_kana && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>
            {school.name_kana}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {futureEvents.map(ev => {
            const d = formatDateJa(ev.event_date)
            return (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '9px 10px', background: 'var(--cream)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ minWidth: 44, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: cfg.color, letterSpacing: '.05em' }}>
                    {d.month}月
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy)', lineHeight: 1 }}>
                    {d.day}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>（{d.weekday}）</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{ev.event_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ev.event_time && <span>🕐 {ev.event_time}</span>}
                    {ev.requires_application !== null && (
                      <span style={{
                        background: ev.requires_application ? '#FEF7E0' : '#E8F5E9',
                        color: ev.requires_application ? '#A07020' : '#2E7D32',
                        padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 700,
                      }}>
                        {ev.requires_application ? '要申込' : '申込不要'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {moreCount > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 10px', textAlign: 'center' }}>
              他 {moreCount} 件のイベントあり →
            </div>
          )}
        </div>
      </div>
      <div style={{
        padding: '10px 18px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          📍{' '}
          {school.distanceKm != null
            ? <strong style={{ color: 'var(--navy)', fontSize: 13 }}>{formatDistance(school.distanceKm)}</strong>
            : '距離未選択'
          }
        </div>
        <span style={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>詳細を見る →</span>
      </div>
    </div>
  )
}
