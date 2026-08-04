'use client'

import { useState, useEffect } from 'react'

interface School {
  id: string
  name: string
}

const REPORT_TYPES = [
  { value: 'date', label: '📅 日程が違う' },
  { value: 'time', label: '🕐 時間が違う' },
  { value: 'url', label: '🔗 URLが違う・リンク切れ' },
  { value: 'deadline', label: '⏰ 申込締切が違う' },
  { value: 'missing', label: '➕ イベントが掲載されていない' },
  { value: 'other', label: '📝 その他' },
]

const FIELD_PLACEHOLDER: Record<string, string> = {
  date: '例：2026-08-10',
  time: '例：13:00〜15:00',
  url: '例：https://...',
  deadline: '例：2026-08-05',
  missing: '例：8/10（月）13:00〜 オープンスクール、申込URL: https://...',
  other: '内容を入力してください',
}

export default function ReportPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [suggestedValues, setSuggestedValues] = useState<Record<string, string>>({})
  const [reporterEmail, setReporterEmail] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/schools-list')
      .then(r => r.json())
      .then(d => setSchools(d.schools ?? []))
  }, [])

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
    // 選択解除時は値もクリア
    if (selectedTypes.includes(type)) {
      setSuggestedValues(prev => {
        const next = { ...prev }
        delete next[type]
        return next
      })
    }
  }

  const handleSubmit = async () => {
    setError('')

    if (!selectedSchoolId) {
      setError('学校名を選択してください')
      return
    }
    if (selectedTypes.length === 0) {
      setError('指摘の種別を1つ以上選択してください')
      return
    }
    // 全選択種別に正しい値が入力されているか確認
    const missingValues = selectedTypes.filter(t => !suggestedValues[t]?.trim())
    if (missingValues.length > 0) {
      setError('選択した種別すべてに正しい値を入力してください')
      return
    }
    if (!reporterEmail.trim()) {
      setError('メールアドレスを入力してください')
      return
    }
    if (!reporterEmail.endsWith('@e-g.city.hiroshima.jp')) {
      setError('広島市教職員のGoogleアカウント（@e-g.city.hiroshima.jp）でのみ投稿できます')
      return
    }
    if (!reporterName.trim()) {
      setError('名前・所属校を入力してください')
      return
    }

    setSubmitting(true)
    const school = schools.find(s => s.id === selectedSchoolId)

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: selectedSchoolId,
        school_name_text: school?.name || '',
        report_type: selectedTypes.join(','),
        description: Object.entries(suggestedValues)
          .map(([type, val]) => {
            const label = REPORT_TYPES.find(t => t.value === type)?.label ?? type
            return `${label}：${val}`
          }).join('\n'),
        suggested_value: null,
        suggested_values: suggestedValues,
        reporter_email: reporterEmail,
        reporter_name: reporterName,
      }),
    })

    if (res.ok) {
      setSubmitted(true)
    } else {
      setError('送信に失敗しました。もう一度お試しください。')
    }
    setSubmitting(false)
  }

  const NAVY = '#1a2742'
  const ACCENT = '#2563EB'
  const LIGHTGRAY = '#F3F4F6'

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: LIGHTGRAY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '48px 40px', textAlign: 'center', maxWidth: 480, boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 8 }}>指摘を送信しました</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>内容を確認の上、順次対応いたします。ご協力ありがとうございました。</div>
          <button
            onClick={() => {
              setSubmitted(false)
              setSelectedSchoolId('')
              setSelectedTypes([])
              setSuggestedValues({})
              setReporterEmail('')
              setReporterName('')
            }}
            style={{ background: NAVY, color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            続けて指摘する
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: LIGHTGRAY }}>
      <div style={{ background: NAVY, color: 'white', padding: '16px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>📣 情報の誤りを報告する</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>広島市進路情報サイト</div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#1e40af' }}>
          📌 このフォームは広島市教職員（@e-g.city.hiroshima.jp）専用です。
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* 学校名 */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 6 }}>
                🏫 学校名 <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <select
                value={selectedSchoolId}
                onChange={e => setSelectedSchoolId(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">選択してください</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* 指摘種別（複数選択） */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 4 }}>
                指摘の種別 <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>複数選択できます。選択した種別ごとに正しい値を入力してください。</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {REPORT_TYPES.map(t => {
                  const isSelected = selectedTypes.includes(t.value)
                  return (
                    <div key={t.value}>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                        padding: '8px 12px', borderRadius: 8,
                        border: `1.5px solid ${isSelected ? ACCENT : '#E5E7EB'}`,
                        background: isSelected ? '#EFF6FF' : 'white',
                      }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleType(t.value)}
                          style={{ accentColor: ACCENT }}
                        />
                        <span style={{ fontSize: 13, color: NAVY }}>{t.label}</span>
                      </label>
                      {/* 選択時に正しい値入力欄を表示 */}
                     {isSelected && (
  <div style={{ marginTop: 6, marginLeft: 12 }}>
    <input
      type="text"
      placeholder={FIELD_PLACEHOLDER[t.value] ?? '正しい値を入力'}
      value={suggestedValues[t.value] ?? ''}
      onChange={e => setSuggestedValues(prev => ({ ...prev, [t.value]: e.target.value }))}
      style={{
        width: '100%', padding: '8px 12px',
        border: `1.5px solid ${
          t.value === 'other'
            ? '#E5E7EB'
            : suggestedValues[t.value]?.trim() ? '#16A34A' : '#FECACA'
        }`,
        borderRadius: 6, fontSize: 13, outline: 'none',
        boxSizing: 'border-box',
      }}
    />
    {t.value !== 'other' && !suggestedValues[t.value]?.trim() && (
      <div style={{ fontSize: 10, color: '#DC2626', marginTop: 2 }}>
        正しい値を入力してください（必須）
      </div>
    )}
  </div>
)}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 投稿者情報 */}
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>投稿者情報</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>
                    名前・所属校 <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="例：井口中学校 原田"
                    value={reporterName}
                    onChange={e => setReporterName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>
                    Googleメールアドレス <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="xxx@e-g.city.hiroshima.jp"
                    value={reporterEmail}
                    onChange={e => setReporterEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ background: submitting ? '#9CA3AF' : NAVY, color: 'white', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? '送信中...' : '📣 指摘を送信する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
