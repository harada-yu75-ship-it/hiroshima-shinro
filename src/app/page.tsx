'use client'

import { useState, useEffect, useMemo } from 'react'
import type { SchoolWithEvents, MiddleSchool, FilterState, SchoolType } from '@/types'
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
  schoolType: 'all',
  keyword: '',
  sortBy: 'distance',
}

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [pendingFilters, setPendingFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [allSchools, setAllSchools] = useState<SchoolWithEvents[]>([])
  const [middleSchools, setMiddleSchools] = useState<MiddleSchool[]>([])
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithEvents | null>(null)

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
    if (filters.schoolType !== 'all') {
      result = result.filter(s => s.school_type === filters.schoolType)
    }
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
      case 'distance':
        result.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999))
        break
      case 'date':
        result.sort((a, b) =>
          (a.events[0]?.event_date ?? '').localeCompare(b.events[0]?.event_date ?? '')
        )
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
        break
    }
    return result
  }, [allSchools, filters, selectedMiddle])

  const typeCounts = useMemo(() => ({
    all:     results.length,
    high:    results.filter(s => s.school_type === 'high').length,
    tsushin: results.filter(s => s.school_type === 'tsushin').length,
    senmon:  results.filter(s => s.school_type === 'senmon').length,
  }), [results])

  return (
    <>
      <Header />
      {usingFallback && (
        <div style={{
          background: '#EBF4FF', borderBottom: '1px solid #BDD9F5',
          color: '#1a5a9a', fontSize: 11, textAlign: 'center', padding: '8px 16px',
        }}>
          ⚠️ デモモード：サンプルデータを表示しています。Supabase接続設定後に実データが表示されます。
        </div>
      )}
      <HeroSection />
      <SearchPanel
        middleSchools={middleSchools}
        pending={pendingFilters}
        onChange={setPendingFilters}
        onSearch={() => setFilters({ ...pendingFilters })}
        onReset={() => { setPendingFilters(INITIAL_FILTERS); setFilters(INITIAL_FILTERS) }}
      />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        <TypeFilterTabs
          active={filters.schoolType}
          counts={typeCounts}
          onChange={(type) => setFilters(f => ({ ...f, schoolType: type as SchoolType | 'all' }))}
        />
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
            <option value="distance">距離順</option>
            <option value="date">開催日順</option>
            <option value="name">学校名順</option>
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
