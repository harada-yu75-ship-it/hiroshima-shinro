'use client'

import type { MiddleSchool, FilterState } from '@/types'

interface Props {
  middleSchools: MiddleSchool[]
  pending: FilterState
  onChange: (f: FilterState) => void
  onSearch: () => void
  onReset: () => void
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700,
  color: 'var(--text-muted)', letterSpacing: '.06em',
  marginBottom: 5, display: 'block',
}

const selectStyle: React.CSSProperties = {
  height: 40, border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '0 12px', fontSize: 13,
  fontFamily: 'inherit', color: 'var(--text)',
  background: 'white', outline: 'none',
  minWidth: 140, transition: 'border-color .2s',
  width: '100%',
}

export default function SearchPanel({ middleSchools, pending, onChange, onSearch, onReset }: Props) {
  const set = (key: keyof FilterState, val: unknown) =>
    onChange({ ...pending, [key]: val })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch()
  }

  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid var(--border)',
      padding: '18px 20px',
      position: 'sticky',
      top: 60,
      zIndex: 90,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', gap: 12,
        flexWrap: 'wrap', alignItems: 'flex-end',
      }}>
        {/* 中学校選択 */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 180px', minWidth: 160 }}>
          <label style={labelStyle}>📍 中学校（起点）</label>
          <select
            style={selectStyle}
            value={pending.middleSchoolId}
            onChange={e => set('middleSchoolId', e.target.value)}
          >
            <option value="">-- 中学校を選択 --</option>
            {middleSchools.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* 距離 */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: '0 0 140px' }}>
          <label style={labelStyle}>📏 距離範囲</label>
          <select
            style={selectStyle}
            value={pending.distanceKm}
            onChange={e => set('distanceKm', Number(e.target.value))}
          >
            <option value={999}>すべての距離</option>
            <option value={5}>半径5km以内</option>
            <option value={10}>半径10km以内</option>
            <option value={15}>半径15km以内</option>
            <option value={20}>半径20km以内</option>
          </select>
        </div>

        {/* キーワード */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 160px', minWidth: 140 }}>
          <label style={labelStyle}>🔍 学校名キーワード</label>
          <input
            type="text"
            placeholder="例：広島、商業、デザイン…"
            value={pending.keyword}
            onChange={e => set('keyword', e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ ...selectStyle }}
          />
        </div>

        {/* ボタン */}
        <button
          onClick={onSearch}
          style={{
            height: 40, padding: '0 22px',
            background: 'var(--red)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-sm)',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            cursor: 'pointer', letterSpacing: '.04em',
            transition: 'background .15s, transform .1s',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--red-light)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--red)')}
        >
          検索する
        </button>
        <button
          onClick={onReset}
          style={{
            height: 40, padding: '0 14px',
            background: 'none', color: 'var(--text-muted)',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12, fontFamily: 'inherit',
            cursor: 'pointer', flexShrink: 0,
            transition: 'border-color .15s, color .15s',
          }}
        >
          リセット
        </button>
      </div>
    </div>
  )
}
