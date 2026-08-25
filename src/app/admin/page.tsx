'use client'

import { useState, useEffect, useCallback } from 'react'

interface Event {
  id: string
  event_name: string
  event_date: string
  event_time: string | null
  requires_application: boolean | null
  capacity: number | null
  notes: string | null
  application_url: string | null
  application_deadline: string | null
  source_url: string
  schools: { name: string; official_url: string }
  update_target_id?: string | null
  update_target?: Event | null
  is_manual?: boolean
}

interface School {
  id: string
  name: string
  official_url: string
  address: string | null
  lat: number | null
  lng: number | null
  crawl_urls: string[]
  crawl_enabled: boolean
  crawl_error: string | null
  crawl_error_count: number
  last_crawled_at: string | null
}

interface Report {
  id: string
  school_id: string | null
  school_name_text: string | null
  report_type: string
  description: string
  suggested_value: string | null
  suggested_values: Record<string, string> | null
  reporter_email: string
  reporter_name: string | null
  status: string
  created_at: string
  resolved_at: string | null
  schools: { name: string } | null
}

const EMPTY_FORM = {
  school_name: '',
  event_name: '',
  event_date: '',
  event_time: '',
  requires_application: '' as '' | 'true' | 'false',
  capacity: '',
  notes: '',
  application_url: '',
  application_deadline: '',
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  date: '📅 日程', time: '🕐 時間', url: '🔗 URL',
  deadline: '⏰ 締切', missing: '➕ 掲載漏れ', other: '📝 その他',
}

// report_typeからeventフィールドへのマッピング
const TYPE_TO_FIELD: Record<string, string> = {
  date: 'event_date',
  url: 'application_url',
  deadline: 'application_deadline',
  time: 'event_time',
}

interface EventCardProps {
  ev: Event
  isVerified: boolean
  editingId: string | null
  editData: Partial<Event>
  onStartEdit: (ev: Event) => void
  onCancelEdit: () => void
  onUpdate: (id: string) => void
  onApprove: (id: string) => void
  onDelete: (id: string) => void
  onEditDataChange: (data: Partial<Event>) => void
}

function EventCard({
  ev, isVerified, editingId, editData,
  onStartEdit, onCancelEdit, onUpdate, onApprove, onDelete, onEditDataChange
}: EventCardProps) {
  const inputStyle = { flex: 1, padding: '5px 8px', border: '1.5px solid #E5E7EB', borderRadius: 6, fontSize: 13, outline: 'none' }
  const labelStyle = { fontSize: 11, color: '#888', minWidth: 80 }

  return (
    <div style={{ background: 'white', borderRadius: 8, border: `1px solid ${isVerified ? '#D1FAE5' : '#E5E7EB'}`, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            {editingId === ev.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'イベント名', key: 'event_name', type: 'text' },
                  { label: '開催日', key: 'event_date', type: 'date' },
                  { label: '時間', key: 'event_time', type: 'text' },
                  { label: '申込締切日', key: 'application_deadline', type: 'date' },
                  { label: '申込URL', key: 'application_url', type: 'text' },
                  { label: '備考', key: 'notes', type: 'text' },
                ].map(({ label, key, type }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={labelStyle}>{label}</label>
                    <input type={type} value={(editData as any)[key] ?? ''} onChange={e => onEditDataChange({ ...editData, [key]: e.target.value })} style={inputStyle} />
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={labelStyle}>要申込</label>
                  <select value={editData.requires_application === true ? 'true' : editData.requires_application === false ? 'false' : ''} onChange={e => onEditDataChange({ ...editData, requires_application: e.target.value === 'true' ? true : e.target.value === 'false' ? false : null })} style={{ padding: '5px 8px', border: '1.5px solid #E5E7EB', borderRadius: 6, fontSize: 13 }}>
                    <option value="">不明</option>
                    <option value="true">要申込</option>
                    <option value="false">申込不要</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2742', marginBottom: 3 }}>{ev.event_name}</div>
                <div style={{ fontSize: 12, color: '#555', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>📅 {ev.event_date}</span>
                  {ev.event_time && <span>🕐 {ev.event_time}</span>}
                  {ev.requires_application !== null && (
                    <span style={{ background: ev.requires_application ? '#FEF7E0' : '#E8F5E9', color: ev.requires_application ? '#A07020' : '#2E7D32', padding: '1px 6px', borderRadius: 3, fontSize: 11, fontWeight: 700 }}>
                      {ev.requires_application ? '要申込' : '申込不要'}
                    </span>
                  )}
                  {ev.application_deadline && <span>⏰ 締切：{ev.application_deadline}</span>}
                </div>
                {ev.notes && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>📝 {ev.notes}</div>}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            {editingId === ev.id ? (
              <>
                <button onClick={() => onUpdate(ev.id)} style={{ background: '#16A34A', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>💾 保存</button>
                <button onClick={onCancelEdit} style={{ background: '#F3F4F6', color: '#555', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>キャンセル</button>
              </>
            ) : (
              <>
                {!isVerified && <button onClick={() => onApprove(ev.id)} style={{ background: '#1a2742', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✅ 承認</button>}
                <button onClick={() => onStartEdit(ev)} style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✏️ 修正</button>
                <button onClick={() => onDelete(ev.id)} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🗑️ 削除</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 更新候補カード
interface UpdateCandidateCardProps {
  ev: Event
  onApply: (id: string) => void
  onIgnore: (id: string) => void
  applying: boolean
}

const DIFF_FIELDS: { key: keyof Event; label: string }[] = [
  { key: 'event_time', label: '時間' },
  { key: 'requires_application', label: '要申込' },
  { key: 'application_deadline', label: '申込締切' },
  { key: 'application_url', label: '申込URL' },
  { key: 'notes', label: '備考' },
]

function formatDiffValue(key: keyof Event, val: any): string {
  if (val === null || val === undefined || val === '') return '（未設定）'
  if (key === 'requires_application') return val === true ? '要申込' : val === false ? '申込不要' : '（未設定）'
  return String(val)
}

function UpdateCandidateCard({ ev, onApply, onIgnore, applying }: UpdateCandidateCardProps) {
  const target = ev.update_target
  const diffs = DIFF_FIELDS.filter(f => {
    const newVal = (ev as any)[f.key] ?? null
    const oldVal = target ? ((target as any)[f.key] ?? null) : null
    return (newVal || null) !== (oldVal || null)
  })

  return (
    <div style={{ background: 'white', borderRadius: 8, border: '1px solid #FDE68A', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 11, color: '#92400E', fontWeight: 700, marginBottom: 2 }}>🏫 {ev.schools?.name}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2742', marginBottom: 2 }}>{ev.event_name}</div>
        <div style={{ fontSize: 12, color: '#555', marginBottom: 10 }}>📅 {ev.event_date}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {diffs.map(f => (
            <div key={String(f.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
              <span style={{ minWidth: 64, color: '#92400E', fontWeight: 700 }}>{f.label}</span>
              <span style={{ color: '#9CA3AF', textDecoration: 'line-through' }}>
                {formatDiffValue(f.key, target ? (target as any)[f.key] : null)}
              </span>
              <span style={{ color: '#9CA3AF' }}>→</span>
              <span style={{ color: '#065F46', fontWeight: 700 }}>
                {formatDiffValue(f.key, (ev as any)[f.key])}
              </span>
            </div>
          ))}
          {diffs.length === 0 && (
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>差分の内訳を取得できませんでした（適用は可能です）</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onApply(ev.id)}
            disabled={applying}
            style={{ background: applying ? '#9CA3AF' : '#16A34A', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: applying ? 'not-allowed' : 'pointer' }}
          >
            {applying ? '適用中...' : '✅ この内容で更新'}
          </button>
          <button
            onClick={() => onIgnore(ev.id)}
            disabled={applying}
            style={{ background: '#F3F4F6', color: '#555', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: applying ? 'not-allowed' : 'pointer' }}
          >
            ✕ 無視する
          </button>
        </div>
      </div>
    </div>
  )
}

// イベント適用パネル
interface ApplyPanelProps {
  report: Report
  verifiedEvents: Event[]
  onApply: (reportId: string, eventId: string, updates: Record<string, string>) => Promise<void>
  onClose: () => void
}

function ApplyPanel({ report, verifiedEvents, onApply, onClose }: ApplyPanelProps) {
  const [selectedEventId, setSelectedEventId] = useState('')
  const [applying, setApplying] = useState(false)

  const schoolName = report.school_name_text || report.schools?.name || ''
  const filteredEvents = verifiedEvents.filter(ev =>
    !schoolName || ev.schools.name.includes(schoolName) || schoolName.includes(ev.schools.name)
  )

  // 適用可能なフィールドを抽出
  const sv = report.suggested_values ?? {}
  const applicableTypes = Object.keys(sv).filter(t => TYPE_TO_FIELD[t])
  const updates: Record<string, string> = {}
  applicableTypes.forEach(t => { updates[TYPE_TO_FIELD[t]] = sv[t] })

  const handleApply = async () => {
    if (!selectedEventId || Object.keys(updates).length === 0) return
    setApplying(true)
    await onApply(report.id, selectedEventId, updates)
    setApplying(false)
    onClose()
  }

  return (
    <div style={{ background: '#F0FFF4', border: '1px solid #D1FAE5', borderRadius: 8, padding: '12px', marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46', marginBottom: 6 }}>🔗 イベントに適用する内容：</div>
      {applicableTypes.map(t => (
        <div key={t} style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>
          <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700, marginRight: 6 }}>{REPORT_TYPE_LABELS[t]}</span>
          <strong>{sv[t]}</strong>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
        <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} style={{ flex: 1, minWidth: 200, padding: '6px 10px', border: '1.5px solid #D1FAE5', borderRadius: 6, fontSize: 12, outline: 'none' }}>
          <option value="">対象イベントを選択...</option>
          {(filteredEvents.length > 0 ? filteredEvents : verifiedEvents).map(ev => (
            <option key={ev.id} value={ev.id}>{ev.schools.name} / {ev.event_date} {ev.event_name}</option>
          ))}
        </select>
        <button onClick={handleApply} disabled={!selectedEventId || applying} style={{ background: selectedEventId ? '#16A34A' : '#9CA3AF', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: selectedEventId ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
          {applying ? '適用中...' : '✅ 適用して対応済にする'}
        </button>
        <button onClick={onClose} style={{ background: '#F3F4F6', color: '#555', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>✕</button>
      </div>
    </div>
  )
}

// 掲載漏れ登録パネル
interface MissingPanelProps {
  report: Report
  schools: School[]
  onRegister: (reportId: string, data: Record<string, any>) => Promise<void>
  onClose: () => void
}

function MissingPanel({ report, schools, onRegister, onClose }: MissingPanelProps) {
  const sv = report.suggested_values ?? {}
  const schoolName = report.school_name_text || report.schools?.name || ''

  const [form, setForm] = useState({
    school_name: schoolName,
    event_name: 'オープンスクール',
    event_date: '',
    event_time: '',
    requires_application: '' as '' | 'true' | 'false',
    application_url: sv['url'] ?? sv['missing'] ?? '',
    application_deadline: sv['deadline'] ?? '',
    notes: sv['missing'] ?? '',
  })
  const [registering, setRegistering] = useState(false)
  const [err, setErr] = useState('')

  const handleRegister = async () => {
    setErr('')
    if (!form.school_name || !form.event_name || !form.event_date) {
      setErr('学校名・イベント名・開催日は必須です')
      return
    }
    const targetSchool = schools.find(s => s.name === form.school_name)
    if (!targetSchool) {
      setErr('学校が見つかりません')
      return
    }
    setRegistering(true)
    await onRegister(report.id, {
      school_id: targetSchool.id,
      event_name: form.event_name,
      event_date: form.event_date,
      event_time: form.event_time || null,
      requires_application: form.requires_application === 'true' ? true : form.requires_application === 'false' ? false : null,
      application_url: form.application_url || null,
      application_deadline: form.application_deadline || null,
      notes: form.notes || null,
      source_url: targetSchool.official_url,
      is_verified: true,
      is_manual: true,
    })
    setRegistering(false)
    onClose()
  }

  const inputStyle = { width: '100%', padding: '6px 10px', border: '1.5px solid #E5E7EB', borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: 11, color: '#555', display: 'block' as const, marginBottom: 3 }

  return (
    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '12px', marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', marginBottom: 10 }}>➕ この指摘からイベントを登録する</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <label style={labelStyle}>学校名 *</label>
          <select value={form.school_name} onChange={e => setForm(f => ({ ...f, school_name: e.target.value }))} style={inputStyle}>
            <option value="">選択してください</option>
            {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        {[
          { label: 'イベント名 *', key: 'event_name', type: 'text' },
          { label: '開催日 *', key: 'event_date', type: 'date' },
          { label: '時間', key: 'event_time', type: 'text' },
          { label: '申込締切日', key: 'application_deadline', type: 'date' },
          { label: '申込URL', key: 'application_url', type: 'text' },
          { label: '備考', key: 'notes', type: 'text' },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputStyle} />
          </div>
        ))}
        <div>
          <label style={labelStyle}>要申込</label>
          <select value={form.requires_application} onChange={e => setForm(f => ({ ...f, requires_application: e.target.value as any }))} style={inputStyle}>
            <option value="">不明</option>
            <option value="true">要申込</option>
            <option value="false">申込不要</option>
          </select>
        </div>
        {err && <div style={{ color: '#DC2626', fontSize: 11 }}>⚠️ {err}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleRegister} disabled={registering} style={{ background: registering ? '#9CA3AF' : '#1a2742', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: registering ? 'not-allowed' : 'pointer' }}>
            {registering ? '登録中...' : '✅ 登録してサイトに掲載'}
          </button>
          <button onClick={onClose} style={{ background: '#F3F4F6', color: '#555', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>キャンセル</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState<'events' | 'schools' | 'reports'>('events')
  const [events, setEvents] = useState<Event[]>([])
  const [verifiedEvents, setVerifiedEvents] = useState<Event[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Event>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [showVerified, setShowVerified] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [approvingSchool, setApprovingSchool] = useState<string | null>(null)
  const [schoolSearch, setSchoolSearch] = useState('')
  const [verifiedSearch, setVerifiedSearch] = useState('')
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null)
  const [editingCrawlUrls, setEditingCrawlUrls] = useState('')
  const [editingCrawlEnabled, setEditingCrawlEnabled] = useState(true)
  const [editingAddress, setEditingAddress] = useState('')
  const [editingLat, setEditingLat] = useState('')
  const [editingLng, setEditingLng] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeMsg, setGeocodeMsg] = useState('')
  const [savingSchool, setSavingSchool] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [applyingReportId, setApplyingReportId] = useState<string | null>(null)
  const [missingReportId, setMissingReportId] = useState<string | null>(null)
  const [applyingUpdateId, setApplyingUpdateId] = useState<string | null>(null)
  const [showUpdateCandidates, setShowUpdateCandidates] = useState(true)
  const [updateCandidateSearch, setUpdateCandidateSearch] = useState('')

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const [unverifiedRes, verifiedRes] = await Promise.all([
      fetch('/api/admin/events'),
      fetch('/api/admin/events?verified=true'),
    ])
    const unverifiedJson = await unverifiedRes.json()
    const verifiedJson = await verifiedRes.json()
    setEvents(unverifiedJson.events ?? [])
    setVerifiedEvents(verifiedJson.events ?? [])
    setLoading(false)
  }, [])

  const fetchSchools = useCallback(async () => {
    const res = await fetch('/api/admin/schools', { cache: 'no-store' })
    const json = await res.json()
    setSchools([...(json.schools ?? []).sort((a: School, b: School) => a.name.localeCompare(b.name, 'ja'))])
  }, [])

  const fetchReports = useCallback(async () => {
    const res = await fetch('/api/reports', { cache: 'no-store' })
    const json = await res.json()
    setReports(json.reports ?? [])
  }, [])

  useEffect(() => {
    fetchEvents()
    fetchSchools()
    fetchReports()
  }, [fetchEvents, fetchSchools, fetchReports])

  const handleApprove = useCallback(async (id: string) => {
    await fetch('/api/admin/events', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'approve' }) })
    fetchEvents()
  }, [fetchEvents])

  const handleApproveAll = async (schoolName: string, schoolEvents: Event[]) => {
    setApprovingSchool(schoolName)
    await Promise.all(schoolEvents.map(ev => fetch('/api/admin/events', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ev.id, action: 'approve' }) })))
    setApprovingSchool(null)
    await fetchEvents()
  }

  const handleUpdate = useCallback(async (id: string) => {
    await fetch('/api/admin/events', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'update', data: editData }) })
    setEditingId(null)
    setEditData({})
    await fetchEvents()
  }, [editData, fetchEvents])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('このイベントを削除しますか？')) return
    await fetch('/api/admin/events', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    fetchEvents()
  }, [fetchEvents])

  const handleApplyUpdate = useCallback(async (id: string) => {
    setApplyingUpdateId(id)
    await fetch('/api/admin/events', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'apply_update' }) })
    setApplyingUpdateId(null)
    await fetchEvents()
  }, [fetchEvents])

  const handleIgnoreUpdate = useCallback(async (id: string) => {
    await fetch('/api/admin/events', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    fetchEvents()
  }, [fetchEvents])

  const handleAdd = async () => {
    setAddError('')
    if (!addForm.school_name || !addForm.event_name || !addForm.event_date) { setAddError('学校名・イベント名・開催日は必須です'); return }
    const school = schools.find(s => s.name === addForm.school_name)
    if (!school) { setAddError(`「${addForm.school_name}」は登録されていない学校名です`); return }
    setAdding(true)
    const res = await fetch('/api/admin/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: school.id, event_name: addForm.event_name, event_date: addForm.event_date,
        event_time: addForm.event_time || null,
        requires_application: addForm.requires_application === 'true' ? true : addForm.requires_application === 'false' ? false : null,
        capacity: addForm.capacity ? Number(addForm.capacity) : null,
        notes: addForm.notes || null, application_url: addForm.application_url || null,
        application_deadline: addForm.application_deadline || null,
        source_url: school.official_url, is_verified: true, is_manual: true,
      }),
    })
    if (!res.ok) { setAddError('登録に失敗しました') } else { setAddForm(EMPTY_FORM); setShowAddForm(false); await fetchEvents() }
    setAdding(false)
  }

  const startEdit = useCallback((ev: Event) => {
    setEditingId(ev.id)
    setEditData({ event_name: ev.event_name, event_date: ev.event_date, event_time: ev.event_time ?? '', requires_application: ev.requires_application, capacity: ev.capacity, notes: ev.notes ?? '', application_url: ev.application_url ?? '', application_deadline: ev.application_deadline ?? '' })
  }, [])

  const cancelEdit = useCallback(() => { setEditingId(null); setEditData({}) }, [])
  const handleEditDataChange = useCallback((data: Partial<Event>) => { setEditData(data) }, [])

  const startEditSchool = (school: School) => {
    setEditingSchoolId(school.id)
    setEditingCrawlUrls((school.crawl_urls ?? []).join('\n'))
    setEditingCrawlEnabled(school.crawl_enabled)
    setEditingAddress(school.address ?? '')
    setEditingLat(school.lat != null ? String(school.lat) : '')
    setEditingLng(school.lng != null ? String(school.lng) : '')
    setGeocodeMsg('')
  }

  const handleGeocode = async () => {
    if (!editingAddress) return
    setGeocoding(true); setGeocodeMsg('')
    try {
      const res = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(editingAddress)}`)
      const data = await res.json()
      if (data && data.length > 0) {
        const [lng, lat] = data[0].geometry.coordinates
        setEditingLat(String(lat)); setEditingLng(String(lng))
        setGeocodeMsg(`✓ 取得成功：${data[0].properties.title}`)
      } else { setGeocodeMsg('⚠️ 住所が見つかりませんでした') }
    } catch { setGeocodeMsg('⚠️ 座標取得に失敗しました') }
    setGeocoding(false)
  }

  const handleSaveSchool = async (schoolId: string) => {
    setSavingSchool(true)
    const urls = editingCrawlUrls.split('\n').map(u => u.trim()).filter(u => u.length > 0)
    await fetch('/api/admin/schools', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: schoolId, crawl_urls: urls, crawl_enabled: editingCrawlEnabled, address: editingAddress || null, lat: editingLat ? Number(editingLat) : null, lng: editingLng ? Number(editingLng) : null }) })
    await fetchSchools(); setEditingSchoolId(null); setSavingSchool(false)
  }

  const handleResolve = async (id: string) => {
    setResolvingId(id)
    await fetch('/api/reports', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'resolved' }) })
    setResolvingId(null); await fetchReports()
  }

  // 指摘をイベントに適用（複数フィールド対応）
  const handleApplyToEvent = async (reportId: string, eventId: string, updates: Record<string, string>) => {
    await fetch('/api/admin/events', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: eventId, action: 'update', data: updates }) })
    await fetch('/api/reports', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reportId, status: 'resolved' }) })
    await Promise.all([fetchEvents(), fetchReports()])
  }

  // 掲載漏れからイベント登録
  const handleRegisterFromReport = async (reportId: string, data: Record<string, any>) => {
    await fetch('/api/admin/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    await fetch('/api/reports', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reportId, status: 'resolved' }) })
    await Promise.all([fetchEvents(), fetchReports()])
  }

  const updateCandidates = events.filter(ev => !!ev.update_target_id)
  const plainEvents = events.filter(ev => !ev.update_target_id)

  const groupedUpdateCandidates = updateCandidates
    .filter(ev => !updateCandidateSearch || ev.schools.name.includes(updateCandidateSearch))
    .reduce((acc, ev) => {
      const name = ev.schools.name
      if (!acc[name]) acc[name] = []
      acc[name].push(ev)
      return acc
    }, {} as Record<string, Event[]>)

  const groupedEvents = plainEvents.reduce((acc, ev) => {
    const name = ev.schools.name
    if (!acc[name]) acc[name] = []
    acc[name].push(ev)
    return acc
  }, {} as Record<string, Event[]>)

  const groupedVerifiedEvents = verifiedEvents
    .filter(ev => !verifiedSearch || ev.schools.name.includes(verifiedSearch))
    .reduce((acc, ev) => {
      const name = ev.schools.name
      if (!acc[name]) acc[name] = []
      acc[name].push(ev)
      return acc
    }, {} as Record<string, Event[]>)

  const filteredSchools = schools.filter(s => s.name.includes(schoolSearch) || (s.crawl_urls ?? []).some(u => u.includes(schoolSearch)))
  const errorSchools = schools.filter(s => s.crawl_error_count > 0)
  const openReports = reports.filter(r => r.status === 'open')

  const inputStyle = { flex: 1, padding: '5px 8px', border: '1.5px solid #E5E7EB', borderRadius: 6, fontSize: 13, outline: 'none' }
  const labelStyle = { fontSize: 11, color: '#888', minWidth: 80 }

  // 指摘カードのボタン表示判定
  const hasApplicableTypes = (r: Report) => {
    const sv = r.suggested_values ?? {}
    return Object.keys(sv).some(t => TYPE_TO_FIELD[t])
  }
  const hasMissing = (r: Report) => {
    const types = r.report_type.split(',')
    return types.includes('missing')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA' }}>
      <div style={{ background: '#1a2742', color: 'white', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900 }}>📋 管理画面</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>広島市進路情報サイト</div>
        </div>
        <a href="/" style={{ background: 'rgba(255,255,255,.15)', color: 'white', textDecoration: 'none', padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>← 情報サイトへ</a>
      </div>

      <div style={{ background: 'white', borderBottom: '2px solid #E5E7EB', display: 'flex' }}>
        {([
          { key: 'events', label: `📋 イベント管理${updateCandidates.length > 0 ? ` 🔄${updateCandidates.length}件` : ''}` },
          { key: 'schools', label: `🏫 学校・クロール管理${errorSchools.length > 0 ? ` ⚠️${errorSchools.length}件エラー` : ''}` },
          { key: 'reports', label: `📣 指摘一覧${openReports.length > 0 ? ` 🔴${openReports.length}件` : ''}` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '12px 20px', border: 'none', background: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: tab === t.key ? '#1a2742' : '#888', borderBottom: tab === t.key ? '2px solid #1a2742' : '2px solid transparent', marginBottom: -2 }}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        {/* ===== イベント管理タブ ===== */}
        {tab === 'events' && (
          <>
            <div style={{ background: 'white', borderRadius: 10, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <div onClick={() => setShowAddForm(v => !v)} style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: showAddForm ? '#F0F7FF' : 'white' }}>
                <div style={{ fontWeight: 700, color: '#1a2742', fontSize: 14 }}>➕ イベントを手動登録</div>
                <span style={{ color: '#888', fontSize: 12 }}>{showAddForm ? '▲ 閉じる' : '▼ 開く'}</span>
              </div>
              {showAddForm && (
                <div style={{ padding: '16px 18px', borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label style={labelStyle}>学校名 *</label>
                      <select value={addForm.school_name} onChange={e => setAddForm(f => ({ ...f, school_name: e.target.value }))} style={inputStyle}>
                        <option value="">選択してください（全{schools.length}校）</option>
                        {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    {[
                      { label: 'イベント名 *', key: 'event_name', type: 'text', placeholder: 'オープンスクール' },
                      { label: '開催日 *', key: 'event_date', type: 'date', placeholder: '' },
                      { label: '時間', key: 'event_time', type: 'text', placeholder: '13:00〜15:00' },
                      { label: '申込締切日', key: 'application_deadline', type: 'date', placeholder: '' },
                      { label: '申込URL', key: 'application_url', type: 'text', placeholder: 'https://...' },
                      { label: '定員', key: 'capacity', type: 'number', placeholder: '100' },
                      { label: '備考', key: 'notes', type: 'text', placeholder: '先着順など' },
                    ].map(({ label, key, type, placeholder }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={labelStyle}>{label}</label>
                        <input type={type} placeholder={placeholder} value={(addForm as any)[key]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))} style={inputStyle} />
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label style={labelStyle}>要申込</label>
                      <select value={addForm.requires_application} onChange={e => setAddForm(f => ({ ...f, requires_application: e.target.value as any }))} style={{ padding: '5px 8px', border: '1.5px solid #E5E7EB', borderRadius: 6, fontSize: 13 }}>
                        <option value="">不明</option><option value="true">要申込</option><option value="false">申込不要</option>
                      </select>
                    </div>
                    {addError && <div style={{ color: '#DC2626', fontSize: 12 }}>⚠️ {addError}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button onClick={handleAdd} disabled={adding} style={{ background: '#1a2742', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: adding ? 'not-allowed' : 'pointer' }}>{adding ? '登録中...' : '✅ 登録してサイトに掲載'}</button>
                      <button onClick={() => { setAddForm(EMPTY_FORM); setShowAddForm(false); setAddError('') }} style={{ background: '#F3F4F6', color: '#555', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>キャンセル</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 更新候補セクション */}
            {updateCandidates.length > 0 && (
              <div style={{ background: 'white', borderRadius: 10, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #FDE68A', overflow: 'hidden' }}>
                <div onClick={() => setShowUpdateCandidates(v => !v)} style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: showUpdateCandidates ? '#FFFBEB' : 'white' }}>
                  <div style={{ fontWeight: 700, color: '#92400E', fontSize: 14 }}>🔄 更新候補（{updateCandidates.length}件）</div>
                  <span style={{ color: '#888', fontSize: 12 }}>{showUpdateCandidates ? '▲ 閉じる' : '▼ 開く'}</span>
                </div>
                {showUpdateCandidates && (
                  <div style={{ padding: '16px 18px', borderTop: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: 11, color: '#92400E', marginBottom: 12 }}>
                      掲載済みイベントと同じ日付で、学校サイトの内容が変わっていた項目です。「無視する」を押しても掲載中の内容には影響しません。
                    </div>
                    <input
                      type="text"
                      placeholder="学校名で絞り込み..."
                      value={updateCandidateSearch}
                      onChange={e => setUpdateCandidateSearch(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', marginBottom: 16, border: '1.5px solid #FDE68A', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                    {Object.keys(groupedUpdateCandidates).length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#92400E', fontSize: 13, padding: '20px 0' }}>
                        {updateCandidateSearch ? `「${updateCandidateSearch}」に一致する学校はありません` : '更新候補はありません'}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {Object.entries(groupedUpdateCandidates).sort(([a], [b]) => a.localeCompare(b, 'ja')).map(([schoolName, schoolCandidates]) => (
                          <div key={schoolName} style={{ borderRadius: 10, border: '1px solid #FDE68A', overflow: 'hidden' }}>
                            <div style={{ padding: '10px 14px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', display: 'flex', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, color: '#92400E', fontSize: 13 }}>🏫 {schoolName}</span>
                              <span style={{ fontSize: 11, color: '#92400E', marginLeft: 8 }}>{schoolCandidates.length}件</span>
                            </div>
                            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {schoolCandidates.sort((a, b) => a.event_date.localeCompare(b.event_date)).map(ev => (
                                <UpdateCandidateCard
                                  key={ev.id}
                                  ev={ev}
                                  onApply={handleApplyUpdate}
                                  onIgnore={handleIgnoreUpdate}
                                  applying={applyingUpdateId === ev.id}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, color: '#555' }}>未確認イベント：<strong style={{ color: '#1a2742', fontSize: 18 }}>{plainEvents.length}</strong> 件</div>
              <button onClick={fetchEvents} style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', color: '#555' }}>🔄 更新</button>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>読み込み中...</div>
              : plainEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', background: 'white', borderRadius: 12, color: '#888', fontSize: 14, marginBottom: 20 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>未確認のイベントはありません。
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                  {Object.entries(groupedEvents).map(([schoolName, schoolEvents]) => (
                    <div key={schoolName} style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#1a2742', fontSize: 14 }}>🏫 {schoolName}</span>
                          <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>{schoolEvents.length}件</span>
                          <a href={schoolEvents[0].schools.official_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', fontSize: 11, marginLeft: 8 }}>公式サイト →</a>
                        </div>
                        <button onClick={() => handleApproveAll(schoolName, schoolEvents)} disabled={approvingSchool === schoolName} style={{ background: approvingSchool === schoolName ? '#9CA3AF' : '#16A34A', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: approvingSchool === schoolName ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                          {approvingSchool === schoolName ? '承認中...' : `✅ ${schoolEvents.length}件を一括承認`}
                        </button>
                      </div>
                      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {schoolEvents.map(ev => <EventCard key={ev.id} ev={ev} isVerified={false} editingId={editingId} editData={editData} onStartEdit={startEdit} onCancelEdit={cancelEdit} onUpdate={handleUpdate} onApprove={handleApprove} onDelete={handleDelete} onEditDataChange={handleEditDataChange} />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            <div style={{ background: 'white', borderRadius: 10, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #D1FAE5', overflow: 'hidden' }}>
              <div onClick={() => setShowVerified(v => !v)} style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: showVerified ? '#F0FFF4' : 'white' }}>
                <div style={{ fontWeight: 700, color: '#16A34A', fontSize: 14 }}>✅ 掲載済みイベント（{verifiedEvents.length}件）</div>
                <span style={{ color: '#888', fontSize: 12 }}>{showVerified ? '▲ 閉じる' : '▼ 開く'}</span>
              </div>
              {showVerified && (
                <div style={{ padding: '16px 18px', borderTop: '1px solid #D1FAE5' }}>
                  <input type="text" placeholder="学校名で検索..." value={verifiedSearch} onChange={e => setVerifiedSearch(e.target.value)} style={{ width: '100%', padding: '8px 12px', marginBottom: 16, border: '1.5px solid #D1FAE5', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  {Object.keys(groupedVerifiedEvents).length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: '20px 0' }}>{verifiedSearch ? `「${verifiedSearch}」に一致する学校はありません` : '掲載済みのイベントはありません'}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {Object.entries(groupedVerifiedEvents).sort(([a], [b]) => a.localeCompare(b, 'ja')).map(([schoolName, schoolEvents]) => (
                        <div key={schoolName} style={{ borderRadius: 10, border: '1px solid #D1FAE5', overflow: 'hidden' }}>
                          <div style={{ padding: '10px 14px', background: '#F0FFF4', borderBottom: '1px solid #D1FAE5', display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: '#065F46', fontSize: 13 }}>🏫 {schoolName}</span>
                            <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 8 }}>{schoolEvents.length}件</span>
                            <a href={schoolEvents[0].schools.official_url} target="_blank" rel="noopener noreferrer" style={{ color: '#16A34A', fontSize: 11, marginLeft: 8 }}>公式サイト →</a>
                          </div>
                          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {schoolEvents.sort((a, b) => a.event_date.localeCompare(b.event_date)).map(ev => <EventCard key={ev.id} ev={ev} isVerified={true} editingId={editingId} editData={editData} onStartEdit={startEdit} onCancelEdit={cancelEdit} onUpdate={handleUpdate} onApprove={handleApprove} onDelete={handleDelete} onEditDataChange={handleEditDataChange} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== 学校・クロール管理タブ ===== */}
        {tab === 'schools' && (
          <>
            {errorSchools.length > 0 && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: '#DC2626', fontSize: 14, marginBottom: 8 }}>⚠️ クロールエラーが発生している学校（{errorSchools.length}校）</div>
                {errorSchools.map(s => <div key={s.id} style={{ fontSize: 12, color: '#7F1D1D', marginBottom: 4 }}><strong>{s.name}</strong>（連続{s.crawl_error_count}回）：{s.crawl_error}</div>)}
              </div>
            )}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              <input type="text" placeholder="学校名・URLで検索..." value={schoolSearch} onChange={e => setSchoolSearch(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              <button onClick={fetchSchools} style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', color: '#555' }}>🔄 更新</button>
            </div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>{filteredSchools.length}校表示中（全{schools.length}校）</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredSchools.map(school => (
                <div key={school.id} style={{ background: 'white', borderRadius: 10, border: `1px solid ${school.crawl_error_count > 0 ? '#FECACA' : '#E5E7EB'}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: '#1a2742', fontSize: 14 }}>{school.name}</span>
                        <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, fontWeight: 700, background: school.crawl_enabled ? '#D1FAE5' : '#F3F4F6', color: school.crawl_enabled ? '#065F46' : '#6B7280' }}>{school.crawl_enabled ? '🟢 クロール有効' : '⚫ 無効'}</span>
                        {school.crawl_error_count > 0 && <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: '#FEE2E2', color: '#DC2626', fontWeight: 700 }}>⚠️ エラー{school.crawl_error_count}回</span>}
                      </div>
                      {editingSchoolId !== school.id && <button onClick={() => startEditSchool(school)} style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✏️ 編集</button>}
                    </div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>📍 {school.address ?? '住所未設定'}{school.lat && school.lng && <span style={{ marginLeft: 8, color: '#aaa' }}>({school.lat.toFixed(4)}, {school.lng.toFixed(4)})</span>}</div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>最終クロール：{school.last_crawled_at ? new Date(school.last_crawled_at).toLocaleString('ja-JP') : '未実行'}</div>
                    {school.crawl_error && <div style={{ fontSize: 11, color: '#DC2626', background: '#FEF2F2', padding: '4px 8px', borderRadius: 4, marginBottom: 8 }}>❌ {school.crawl_error}</div>}
                    {editingSchoolId === school.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                        <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px', border: '1px solid #E5E7EB' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#1a2742', marginBottom: 8 }}>📍 住所・座標</div>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <input type="text" placeholder="例：広島市南区宇品海岸1丁目" value={editingAddress} onChange={e => setEditingAddress(e.target.value)} style={{ flex: 1, padding: '6px 10px', border: '1.5px solid #E5E7EB', borderRadius: 6, fontSize: 12, outline: 'none' }} />
                            <button onClick={handleGeocode} disabled={geocoding || !editingAddress} style={{ background: geocoding ? '#9CA3AF' : '#2563EB', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: geocoding ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>{geocoding ? '取得中...' : '📍 座標を自動取得'}</button>
                          </div>
                          {geocodeMsg && <div style={{ fontSize: 11, marginBottom: 8, color: geocodeMsg.startsWith('✓') ? '#16A34A' : '#DC2626' }}>{geocodeMsg}</div>}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>緯度（lat）</div><input type="number" step="0.0001" value={editingLat} onChange={e => setEditingLat(e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1.5px solid #E5E7EB', borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} /></div>
                            <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>経度（lng）</div><input type="number" step="0.0001" value={editingLng} onChange={e => setEditingLng(e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1.5px solid #E5E7EB', borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} /></div>
                          </div>
                        </div>
                        <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px', border: '1px solid #E5E7EB' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#1a2742', marginBottom: 8 }}>🔗 クロールURL</div>
                          <textarea value={editingCrawlUrls} onChange={e => setEditingCrawlUrls(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', border: '1.5px solid #3B82F6', borderRadius: 6, fontSize: 12, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <label style={{ fontSize: 12, color: '#555' }}>クロール有効</label>
                            <input type="checkbox" checked={editingCrawlEnabled} onChange={e => setEditingCrawlEnabled(e.target.checked)} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleSaveSchool(school.id)} disabled={savingSchool} style={{ background: '#1a2742', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: savingSchool ? 'not-allowed' : 'pointer' }}>{savingSchool ? '保存中...' : '💾 保存'}</button>
                          <button onClick={() => setEditingSchoolId(null)} style={{ background: '#F3F4F6', color: '#555', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>キャンセル</button>
                        </div>
                      </div>
                    ) : (
                      <div>{(school.crawl_urls ?? []).length === 0 ? <div style={{ fontSize: 11, color: '#EF4444' }}>⚠️ クロールURL未設定</div> : (school.crawl_urls ?? []).map((url, i) => <div key={i} style={{ fontSize: 11, color: '#2563EB', wordBreak: 'break-all' }}>🔗 {url}</div>)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===== 指摘一覧タブ ===== */}
        {tab === 'reports' && (
          <>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, color: '#555' }}>
                未対応：<strong style={{ color: '#DC2626', fontSize: 18 }}>{openReports.length}</strong> 件　
                対応済：<strong style={{ color: '#16A34A', fontSize: 18 }}>{reports.filter(r => r.status === 'resolved').length}</strong> 件
              </div>
              <button onClick={fetchReports} style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', color: '#555' }}>🔄 更新</button>
            </div>

            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', background: 'white', borderRadius: 12, color: '#888', fontSize: 14 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📣</div>指摘はまだありません
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reports.map(r => (
                  <div key={r.id} style={{ background: 'white', borderRadius: 10, border: `1px solid ${r.status === 'open' ? '#FECACA' : '#D1FAE5'}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: '#1a2742', fontSize: 14 }}>{r.school_name_text || r.schools?.name || '学校未指定'}</span>
                          <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, fontWeight: 700, background: r.status === 'open' ? '#FEE2E2' : '#D1FAE5', color: r.status === 'open' ? '#DC2626' : '#065F46' }}>
                            {r.status === 'open' ? '🔴 未対応' : '✅ 対応済'}
                          </span>
                          <span style={{ fontSize: 11, color: '#6B7280' }}>{new Date(r.created_at).toLocaleString('ja-JP')}</span>
                        </div>
                        {r.status === 'open' && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {hasApplicableTypes(r) && (
                              <button onClick={() => { setApplyingReportId(applyingReportId === r.id ? null : r.id); setMissingReportId(null) }} style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>🔗 イベントに適用</button>
                            )}
                            {hasMissing(r) && (
                              <button onClick={() => { setMissingReportId(missingReportId === r.id ? null : r.id); setApplyingReportId(null) }} style={{ background: '#EFF6FF', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>➕ イベントを登録</button>
                            )}
                            <button onClick={() => handleResolve(r.id)} disabled={resolvingId === r.id} style={{ background: resolvingId === r.id ? '#9CA3AF' : '#16A34A', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: resolvingId === r.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                              {resolvingId === r.id ? '処理中...' : '✅ 対応済にする'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 種別タグ */}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                        {r.report_type.split(',').map(t => (
                          <span key={t} style={{ background: '#EFF6FF', color: '#2563EB', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{REPORT_TYPE_LABELS[t] ?? t}</span>
                        ))}
                      </div>

                      {/* 指摘内容 */}
                      {r.description && (
                        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#374151', whiteSpace: 'pre-wrap', marginBottom: 8 }}>
                          {r.description}
                        </div>
                      )}

                      {/* 正しい値（種別ごと） */}
                      {r.suggested_values && Object.keys(r.suggested_values).length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                          {Object.entries(r.suggested_values).map(([type, val]) => (
                            <div key={type} style={{ background: '#F0FFF4', border: '1px solid #D1FAE5', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: '#065F46' }}>
                              <span style={{ fontWeight: 700 }}>{REPORT_TYPE_LABELS[type] ?? type}：</span>{val}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 適用パネル */}
                      {applyingReportId === r.id && (
                        <ApplyPanel report={r} verifiedEvents={verifiedEvents} onApply={handleApplyToEvent} onClose={() => setApplyingReportId(null)} />
                      )}

                      {/* 掲載漏れ登録パネル */}
                      {missingReportId === r.id && (
                        <MissingPanel report={r} schools={schools} onRegister={handleRegisterFromReport} onClose={() => setMissingReportId(null)} />
                      )}

                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>投稿者：{r.reporter_name || ''} {r.reporter_email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
