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

export default function ReportPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [form, setForm] = useState({
    school_id: '',
    report_type: '',
    description: '',
    suggested_value: '',
    reporter_email: '',
    reporter_name: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/schools-list')
      .then(r => r.json())
      .then(d => setSchools(d.schools ?? []))
  }, [])

  const handleSubmit = async () => {
    setError('')
    if (!form.report_type || !form.description || !form.reporter_email) {
      setError('指摘種別・内容・メールアドレスは必須です')
      return
    }
    if (!form.reporter_email.endsWith('@e-g.city.hiroshima.jp')) {
      setError('広島市教職員のGoogleアカウント（@e-g.city.hiroshima.jp）でのみ投稿できます')
      return
    }
    setSubmitting(true)
    const school = schools.find(s => s.id === form.school_id)
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: form.school_id || null,
        school_name_text: school?.name || '',
        report_type: form.report_type,
        description: form.description,
        suggested_value: form.suggested_value || null,
        reporter_email: form.reporter_email,
        reporter_name: form.reporter_name || null,
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
            onClick={() => { setSubmitted(false); setForm({ school_id: '', report_type: '', description: '', suggested_value: '', reporter_email: '', reporter_name: '' }) }}
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
      {/* ヘッダー */}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* 学校名 */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 6 }}>
                🏫 学校名（わかる場合）
              </label>
              <select
                value={form.school_id}
                onChange={e => setForm(f => ({ ...f, school_id: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">選択してください（任意）</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* 指摘種別 */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 6 }}>
                指摘の種別 <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {REPORT_TYPES.map(t => (
                  <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${form.report_type === t.value ? ACCENT : '#E5E7EB'}`, background: form.report_type === t.value ? '#EFF6FF' : 'white' }}>
                    <input
                      type="radio"
                      name="report_type"
                      value={t.value}
                      checked={form.report_type === t.value}
                      onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}
                      style={{ accentColor: ACCENT }}
                    />
                    <span style={{ fontSize: 13, color: NAVY }}>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 内容 */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 6 }}>
                指摘の内容 <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                placeholder="例：広島県立○○高校の8/10のオープンスクールの時間が10:00〜になっているが、正しくは13:00〜です。"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            {/* 正しい値 */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: NAVY, display: 'block', marginBottom: 4 }}>
                正しい値・内容（わかる場合）
              </label>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6 }}>入力いただくと管理者がすぐに修正できます</div>
              <input
                type="text"
                placeholder="例：13:00〜15:00、https://..."
                value={form.suggested_value}
                onChange={e => setForm(f => ({ ...f, suggested_value: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* 投稿者情報 */}
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>投稿者情報</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>
                    Googleメールアドレス <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="xxx@e-g.city.hiroshima.jp"
                    value={form.reporter_email}
                    onChange={e => setForm(f => ({ ...f, reporter_email: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>お名前・所属校（任意）</label>
                  <input
                    type="text"
                    placeholder="例：井口中学校 原田"
                    value={form.reporter_name}
                    onChange={e => setForm(f => ({ ...f, reporter_name: e.target.value }))}
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
