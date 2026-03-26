'use client'

import { useEffect } from 'react'
import type { SchoolWithEvents } from '@/types'
import { formatDateJa, formatDistance, isFutureOrToday } from '@/lib/utils'

interface Props {
  school: SchoolWithEvents
  onClose: () => void
}

const TYPE_CONFIG = {
  high:    { label: '全日制高校', bg: '#FDECEA', color: '#C0392B', accent: '#C0392B' },
  tsushin: { label: '通信制高校', bg: '#EDE9FF', color: '#5B4FCF', accent: '#7B68EE' },
  senmon:  { label: '専門学校',   bg: '#FEF7E0', color: '#A07020', accent: '#D4A843' },
}

export default function SchoolModal({ school, onClose }: Props) {
  const cfg = TYPE_CONFIG[school.school_type] ?? TYPE_CONFIG.high
  const events = school.events.filter(e => isFutureOrToday(e.event_date))
    .sort((a, b) => a.event_date.localeCompare(b.event_date))

  // ESCキーで閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,28,50,.6)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        className="animate-fade-in-up"
        style={{
          background: 'white',
          borderRadius: 16,
          maxWidth: 580, width: '100%',
          maxHeight: '88vh', overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,.28)',
        }}
      >
        {/* ヘッダー */}
        <div style={{ height: 5, background: cfg.accent, borderRadius: '16px 16px 0 0' }} />
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: 'inline-block', fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 3,
              background: cfg.bg, color: cfg.color, marginBottom: 6,
            }}>
              {cfg.label}
            </span>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy)', lineHeight: 1.3 }}>
              {school.name}
            </div>
            {school.name_kana && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {school.name_kana}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="閉じる"
            style={{
              background: 'none', border: 'none',
              fontSize: 22, cursor: 'pointer',
              color: 'var(--text-muted)', padding: '0 4px',
              lineHeight: 1, flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* ボディ */}
        <div style={{ padding: '18px 22px 24px' }}>
          {/* 学校情報 */}
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              📍 {school.address}
            </div>
            {school.distanceKm != null && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                📏 起点から <strong style={{ color: 'var(--navy)' }}>{formatDistance(school.distanceKm)}</strong>
              </div>
            )}
            <div style={{ fontSize: 12 }}>
              🔗{' '}
              <a
                href={school.official_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: cfg.color, fontWeight: 600 }}
              >
                公式サイトを見る
              </a>
            </div>
          </div>

          {/* イベント一覧 */}
          <div style={{
            fontWeight: 700, fontSize: 13, color: 'var(--navy)',
            borderBottom: `2px solid ${cfg.accent}`,
            paddingBottom: 6, marginBottom: 12,
          }}>
            開催予定のイベント一覧
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map(ev => {
              const d = formatDateJa(ev.event_date)
              return (
                <div key={ev.id} style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                }}>
                  {/* イベントヘッダー */}
                  <div style={{
                    padding: '10px 14px 8px',
                    background: 'var(--cream)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ textAlign: 'center', minWidth: 40 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: cfg.color }}>
                        {d.month}月
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--navy)', lineHeight: 1 }}>
                        {d.day}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        （{d.weekday}）
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>
                        {ev.event_name}
                      </div>
                      {ev.event_time && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          🕐 {ev.event_time}
                        </div>
                      )}
                    </div>
                    {ev.requires_application !== null && (
                      <span style={{
                        marginLeft: 'auto',
                        background: ev.requires_application ? '#FEF7E0' : '#E8F5E9',
                        color: ev.requires_application ? '#A07020' : '#2E7D32',
                        padding: '3px 8px', borderRadius: 4,
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>
                        {ev.requires_application ? '要申込' : '申込不要'}
                      </span>
                    )}
                  </div>

                  {/* 詳細情報 */}
                  {(ev.notes || ev.capacity || ev.application_url) && (
                    <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                      {ev.capacity && <div>👥 定員：{ev.capacity}名</div>}
                      {ev.notes && <div>📝 {ev.notes}</div>}
                      {ev.application_url && (
                        <div>
                          📋{' '}
                          <a
                            href={ev.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: cfg.color, fontWeight: 600 }}
                          >
                            申込ページへ
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 未確認データの注意書き */}
          {events.some(e => !e.is_verified) && (
            <div style={{
              marginTop: 14,
              padding: '8px 12px',
              background: '#FEF7E0',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11, color: '#A07020',
            }}>
              ⚠️ 一部のイベント情報は自動取得データです。最新情報は公式サイトでご確認ください。
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
