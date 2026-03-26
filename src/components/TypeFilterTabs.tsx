'use client'

interface Props {
  active: string
  counts: { all: number; high: number; tsushin: number; senmon: number }
  onChange: (type: string) => void
}

const TABS = [
  { key: 'all',     label: 'すべて',     color: 'var(--navy)' },
  { key: 'high',    label: '全日制高校', color: 'var(--red)' },
  { key: 'tsushin', label: '通信制高校', color: '#7B68EE' },
  { key: 'senmon',  label: '専門学校',   color: 'var(--gold)' },
]

export default function TypeFilterTabs({ active, counts, onChange }: Props) {
  return (
    <div style={{
      display: 'flex', gap: 8, flexWrap: 'wrap',
      marginTop: 20,
    }}>
      {TABS.map(tab => {
        const isActive = active === tab.key
        const count = counts[tab.key as keyof typeof counts]
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
              fontSize: 10,
              fontWeight: 700,
              minWidth: 20,
              textAlign: 'center',
            }}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
