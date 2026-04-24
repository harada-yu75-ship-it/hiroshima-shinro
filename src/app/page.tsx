'use client'

import { useState, useEffect, useMemo } from 'react'
import type { SchoolWithEvents, MiddleSchool, FilterState, SchoolFilter } from '@/types'
import { haversineKm, isFutureOrToday } from '@/lib/utils'
import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import SearchPanel from '@/components/SearchPanel'
import TypeFilterTabs from '@/components/TypeFilterTabs'
import SchoolCard from '@/components/SchoolCard'
import SchoolModal from '@/components/SchoolModal'
import SkeletonCard from '@/components/SkeletonCard'

const INITIAL_FILTERS: FilterState = {
  middleSchoolId: '',
  distanceKm: 999,
  schoolFilter: 'all',
  keyword: '',
  sortBy: 'new',
}

function matchesFilter(school: SchoolWithEvents, filter: SchoolFilter): boolean {
  switch (filter) {
    case 'all':          return true
    case 'high_public':  return school.school_type === 'high' && school.is_public
    case 'high_private': return school.school_type === 'high' && !school.is_public
    case 'tsushin':      return school.school_type === 'tsushin'
    case 'senmon':       return school.school_type === 'senmon'
    case 'senmon_kouto':  return school.school_type === 'senmon_kouto'
  }
}

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [pendingFilters, setPendingFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [allSchools, setAllSchools] = useState<SchoolWithEvents[]>([])
  const [middleSchools, setMiddleSchools] = useState<MiddleSchool[]>([])
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithEvents | null>(null)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/schools').then(r => r.json()),
      fetch('/api/middle-schools').then(r => r.json()),
    ]).then(([schoolsRes, msRes]) => {
      setAllSchools(schoolsRes.schools ?? [])
      setUsingFallback(schoolsRes.usingFallback ?? false)
      setMiddleSchools(msRes.schools ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const selectedMiddle = useMemo(
    () => middleSchools.find(m => m.id === filters.middleSchoolId) ?? null,
    [middleSchools, filters.middleSchoolId]
  )

  const results = useMemo((): SchoolWithEvents[] => {
    let result = allSchools.filter(s =>
      s.events.some(e => isFutureOrToday(e.event_date))
    )
    if (filters.keyword.trim()) {
      const kw = filters.keyword.trim()
      result = result.filter(s =>
        s.name.includes(kw) || (s.name_kana ?? '').includes(kw)
      )
    }
    result = result.filter(s => matchesFilter(s, filters.schoolFilter))
    result = result.map(s => ({
      ...s,
      distanceKm: selectedMiddle
        ? haversineKm(selectedMiddle.lat, selectedMiddle.lng, s.lat, s.lng)
        : null,
      events: s.events
        .filter(e => isFutureOrToday(e.event_date))
        .sort((a, b) => a.event_date.localeCompare(b.event_date)),
    }))
    if (selectedMiddle && filters.distanceKm < 999) {
      result = result.filter(s => (s.distanceKm ?? 9999) <= filters.distanceKm)
    }
    switch (filters.sortBy) {
      case 'new':
        result.sort((a, b) => {
          const aDate = a.events[0]?.crawled_at ?? ''
          const bDate = b.events[0]?.crawled_at ?? ''
          return bDate.localeCompare(aDate)
        })
        break
      case 'date':
        result.sort((a, b) =>
          (a.events[0]?.event_date ?? '').localeCompare(b.events[0]?.event_date ?? '')
        )
        break
    }
    return result
  }, [allSchools, filters, selectedMiddle])

  const counts = useMemo(() => ({
    all:          results.length,
    high_public:  results.filter(s => s.school_type === 'high' && s.is_public).length,
    high_private: results.filter(s => s.school_type === 'high' && !s.is_public).length,
    tsushin:      results.filter(s => s.school_type === 'tsushin').length,
    senmon:       results.filter(s => s.school_type === 'senmon').length,
    senmon_kouto:  results.filter(s => s.school_type === 'senmon_kouto').length,
  }), [results])

  const hasActiveSearch = filters.middleSchoolId || filters.keyword.trim() || filters.distanceKm < 999

  return (
    <>
      <Header />
      {usingFallback && (
        <div style={{
          background: '#EBF4FF', borderBottom: '1px solid #BDD9F5',
          color: '#1a5a9a', fontSize: 11, textAlign: 'center', padding: '8px 16px',
        }}>
          ⚠️ デモモード：サンプルデータを表示しています。
        </div>
      )}
      <HeroSection />

      {/* コントロールバー */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'white', borderBottom: '1px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0,0,0,.06)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '10px 16px' }}>

          {/* 絞り込みパネル（開閉） */}
          {showSearch ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>🔍 絞り込み検索</span>
                <button
                  onClick={() => setShowSearch(false)}
                  style={{
                    background: 'none', border: '1.5px solid var(--border)',
                    borderRadius: 999, padding: '4px 12px',
                    fontSize: 12, color: 'var(--text-muted)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ✕ 閉じる
                </button>
              </div>
              <SearchPanel
                middleSchools={middleSchools}
                pending={pendingFilters}
                onChange={setPendingFilters}
                onSearch={() => { setFilters({ ...pendingFilters }); setShowSearch(false) }}
                onReset={() => { setPendingFilters(INITIAL_FILTERS); setFilters(INITIAL_FILTERS) }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* タブフィルター */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <TypeFilterTabs
                  active={filters.schoolFilter}
                  counts={counts}
                  onChange={(f) => setFilters(prev => ({ ...prev, schoolFilter: f as SchoolFilter }))}
                />
              </div>
              {/* 絞り込みボタン */}
              <button
                onClick={() => setShowSearch(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: hasActiveSearch ? 'var(--navy)' : 'white',
                  color: hasActiveSearch ? 'white' : 'var(--text-muted)',
                  border: `1.5px solid ${hasActiveSearch ? 'var(--navy)' : 'var(--border)'}`,
                  borderRadius: 999, padding: '6px 14px',
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                🔍 絞り込み{hasActiveSearch ? ' ●' : ''}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 20, marginBottom: 16, gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {selectedMiddle && (
              <span style={{ marginRight: 8, color: 'var(--navy)', fontWeight: 700 }}>
                📍 {selectedMiddle.name} 起点
              </span>
            )}
            <strong style={{ color: 'var(--red)', fontSize: 20, fontWeight: 900 }}>
              {loading ? '—' : results.length}
            </strong>{' '}件の学校が見つかりました
          </div>
          <select
            value={filters.sortBy}
            onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value as FilterState['sortBy'] }))}
            style={{
              border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '5px 10px', fontSize: 12, fontFamily: 'inherit',
              color: 'var(--text-muted)', background: 'white', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="new">新着順</option>
            <option value="date">開催日順</option>
          </select>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16, marginBottom: 60,
        }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : results.length > 0
              ? results.map((school, i) => (
                  <SchoolCard
                    key={school.id}
                    school={school}
                    animationDelay={Math.min(i * 50, 400)}
                    onClick={() => setSelectedSchool(school)}
                  />
                ))
              : (
                <div style={{
                  gridColumn: '1/-1', textAlign: 'center',
                  padding: '80px 0', color: 'var(--text-muted)',
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🏫</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                    条件に合う学校が見つかりません
                  </div>
                  <div style={{ fontSize: 13 }}>
                    距離範囲を広げるか、絞り込み条件を変更してみてください
                  </div>
                </div>
              )
          }
        </div>
      </div>
      {selectedSchool && (
        <SchoolModal school={selectedSchool} onClose={() => setSelectedSchool(null)} />
      )}
    </>
  )
}
