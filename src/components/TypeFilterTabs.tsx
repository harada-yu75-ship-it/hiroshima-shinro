'use client'

import type { SchoolFilter } from '@/types'

interface Props {
  active: SchoolFilter
  counts: Record<SchoolFilter, number>
  onChange: (filter: SchoolFilter) => void
}

const TABS: { key: SchoolFilter; label: string; color: string }[] = [
  { key: 'all',          label: 'すべて',        color: 'var(--navy)' },
  { key: 'high_public',  label: '全日制（公立）', color: '#C0392B' },
  { key: 'high_private', label: '全日制（私立）', color: '#E67E22' },
  { key: 'tsushin',      label: '通信制',         color: '#7B68EE' },
  { key: 'senmon',       label: '専門学校',       color: '#D4A843' },
]

export default function TypeFilterTabs({ active, counts, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
      {TABS.map(tab => {
        const isActive = active === tab.key
        const count = counts[tab.key] ?? 0
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: `1.5px solid ${isActive ? tab.color : 'var(--border)'}`,
              background: isActive ? tab.color : 'white',
              color: isActive ? 'white' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {tab.label}
            <span style={{
              display: 'inline-block',
              background: isActive ? 'rgba(255,255,255,.25)' : 'var(--cream)',
              color: isActive ? 'white' : 'var(--text-muted)',
              borderRadius: 999,
              padding: '0 6px',
              fontSize: 10, fontWeight: 700,
              minWidth: 20, textAlign: 'center',
            }}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
