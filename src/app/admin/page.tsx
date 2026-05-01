'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
}

interface School {
  id: string
  name: string
  official_url: string
}

const EMPTY_FORM = {
  school_id: '',
  event_name: '',
  event_date: '',
  event_time: '',
  requires_application: '' as '' | 'true' | 'false',
  capacity: '',
  notes: '',
  application_url: '',
  application_deadline: '',
}

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Event>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [adding, setAdding] = useState(false)
  const router = useRouter()

  const fetchEvents = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/events')
    const json = await res.json()
    setEvents(json.events ?? [])
    setLoading(false)
  }

  const fetchSchools = async () => {
    const res = await fetch('/api/admin/schools')
    const json = await res.json()
    setSchools((json.schools ?? []).map((s: any) => ({
      id: s.id, name: s.name, official_url: s.official_url
    })).sort((a: School, b: School) => a.name.localeCompare(b.name, 'ja')))
  }

  useEffect(() => {
    fetchEvents()
    fetchSchools()
  }, [])

  const handleApprove = async (id: string) => {
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'approve' }),
    })
    fetchEvents()
  }

  const handleUpdate = async (id: string) => {
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'update', data: editData }),
    })
    setEditingId(null)
    setEditData({})
    await fetchEvents()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このイベントを削除しますか？')) return
    await fetch('/api/admin/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchEvents()
  }

  const handleAdd = async () => {
    if (!addForm.school_id || !addForm.event_name || !addForm.event_date) {
      alert('学校・イベント名・開催日は必須です')
      return
    }
    setAdding(true)
    await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: addForm.school_id,
        event_name: addForm.event_name,
        event_date: addForm.event_date,
        event_time: addForm.event_time || null,
        requires_application: addForm.requires_application === 'true' ? true : addForm.requires_application === 'false' ? false : null,
        capacity: addForm.capacity ? Number(addForm.capacity) : null,
        notes: addForm.notes || null,
        application_url: addForm.application_url || null,
        application_deadline: addForm.application_deadline || null,
        source_url: schools.find(s => s.id === addForm.school_id)?.official_url ?? '',
        is_verified: true,
      }),
    })
    setAddForm(EMPTY_FORM)
    setShowAddForm(false)
    setAdding(false)
    await fetchEvents()
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const startEdit = (ev: Event) => {
    setEditingId(ev.id)
    setEditData({
      event_name: ev.event_name,
      event_date: ev.event_date,
      event_time: ev.event_time ?? '',
      requires_application: ev.requires_application,
      capacity: ev.capacity,
      notes: ev.notes ?? '',
      application_url: ev.application_url ?? '',
      application_deadline: ev.application_deadline ?? '',
    })
  }

  const inputStyle = {
    flex: 1, padding: '5px 8px',
    border: '1.5px solid #E5E7EB', borderRadius: 6,
    fontSize: 13, outline: 'none',
  }

  const labelStyle = { fontSize: 11, color: '#888', minWidth: 80 }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA' }}>
      {/* ヘッダー */}
      <div style={{
        background: '#1a2742', color: 'white',
        padding: '14px 24px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900 }}>📋 イベント管理画面</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>広島市進路情報サイト</div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(255,255,255,.15)', border: 'none',
            color: 'white', padding: '6px 14px', borderRadius: 6,
            fontSize: 12, cursor: 'pointer',
          }}
        >
          ログアウト
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        {/* 手動登録フォーム */}
        <div style={{
          background: 'white', borderRadius: 10, marginBottom: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}>
          <div
            onClick={() => setShowAddForm(v => !v)}
            style={{
              padding: '14px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: showAddForm ? '#F0F7FF' : 'white',
            }}
          >
            <div style={{ fontWeight: 700, color: '#1a2742', fontSize: 14 }}>
              ➕ イベントを手動登録
            </div>
            <span style={{ color: '#888', fontSize: 12 }}>{showAddForm ? '▲ 閉じる' : '▼ 開く'}</span>
          </div>

          {showAddForm && (
            <div style={{ padding: '16px 18px', borderTop: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* 学校選択 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={labelStyle}>学校名 *</label>
                  <select
                    value={addForm.school_id}
                    onChange={e => setAddForm(f => ({ ...f, school_id: e.target.value }))}
                    style={{ ...inputStyle, flex: 1 }}
                  >
                    <option value="">学校を選択してください</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* 各フィールド */}
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
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={(addForm as any)[key]}
                      onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                ))}

                {/* 要申込 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={labelStyle}>要申込</label>
                  <select
                    value={addForm.requires_application}
                    onChange={e => setAddForm(f => ({ ...f, requires_application: e.target.value as any }))}
                    style={{ ...inputStyle, flex: 'none', width: 120 }}
                  >
                    <option value="">不明</option>
                    <option value="true">要申込</option>
                    <option value="false">申込不要</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    onClick={handleAdd}
                    disabled={adding}
                    style={{
                      background: '#1a2742', color: 'white', border: 'none',
                      borderRadius: 6, padding: '8px 20px', fontSize: 13,
                      fontWeight: 700, cursor: adding ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {adding ? '登録中...' : '✅ 登録してサイトに掲載'}
                  </button>
                  <button
                    onClick={() => { setAddForm(EMPTY_FORM); setShowAddForm(false) }}
                    style={{
                      background: '#F3F4F6', color: '#555', border: 'none',
                      borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 未確認イベント一覧 */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, color: '#555' }}>
            未確認イベント：<strong style={{ color: '#1a2742', fontSize: 18 }}>{events.length}</strong> 件
          </div>
          <button
            onClick={fetchEvents}
            style={{
              background: 'white', border: '1.5px solid #E5E7EB',
              borderRadius: 6, padding: '6px 14px', fontSize: 12,
              cursor: 'pointer', color: '#555',
            }}
          >
            🔄 更新
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>読み込み中...</div>
        ) : events.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            background: 'white', borderRadius: 12,
            color: '#888', fontSize: 14,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            未確認のイベントはありません
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map(ev => (
              <div key={ev.id} style={{
                background: 'white', borderRadius: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                border: '1px solid #E5E7EB', overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>
                        🏫 {ev.schools.name}　
                        <a href={ev.schools.official_url} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#2563EB', fontSize: 11 }}>
                          公式サイト →
                        </a>
                      </div>

                      {editingId === ev.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
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
                              <input
                                type={type}
                                value={(editData as any)[key] ?? ''}
                                onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))}
                                style={inputStyle}
                              />
                            </div>
                          ))}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <label style={labelStyle}>要申込</label>
                            <select
                              value={editData.requires_application === true ? 'true' : editData.requires_application === false ? 'false' : ''}
                              onChange={e => setEditData(d => ({
                                ...d,
                                requires_application: e.target.value === 'true' ? true : e.target.value === 'false' ? false : null
                              }))}
                              style={{ padding: '5px 8px', border: '1.5px solid #E5E7EB', borderRadius: 6, fontSize: 13 }}
                            >
                              <option value="">不明</option>
                              <option value="true">要申込</option>
                              <option value="false">申込不要</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2742', marginBottom: 4 }}>
                            {ev.event_name}
                          </div>
                          <div style={{ fontSize: 12, color: '#555', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span>📅 {ev.event_date}</span>
                            {ev.event_time && <span>🕐 {ev.event_time}</span>}
                            {ev.requires_application !== null && (
                              <span style={{
                                background: ev.requires_application ? '#FEF7E0' : '#E8F5E9',
                                color: ev.requires_application ? '#A07020' : '#2E7D32',
                                padding: '1px 6px', borderRadius: 3, fontSize: 11, fontWeight: 700,
                              }}>
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
                          <button onClick={() => handleUpdate(ev.id)} style={{
                            background: '#16A34A', color: 'white', border: 'none',
                            borderRadius: 6, padding: '6px 14px', fontSize: 12,
                            fontWeight: 700, cursor: 'pointer',
                          }}>
                            💾 保存
                          </button>
                          <button onClick={() => { setEditingId(null); setEditData({}) }} style={{
                            background: '#F3F4F6', color: '#555', border: 'none',
                            borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer',
                          }}>
                            キャンセル
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleApprove(ev.id)} style={{
                            background: '#1a2742', color: 'white', border: 'none',
                            borderRadius: 6, padding: '6px 14px', fontSize: 12,
                            fontWeight: 700, cursor: 'pointer',
                          }}>
                            ✅ 承認
                          </button>
                          <button onClick={() => startEdit(ev)} style={{
                            background: '#EFF6FF', color: '#2563EB', border: 'none',
                            borderRadius: 6, padding: '6px 14px', fontSize: 12,
                            fontWeight: 700, cursor: 'pointer',
                          }}>
                            ✏️ 修正
                          </button>
                          <button onClick={() => handleDelete(ev.id)} style={{
                            background: '#FEF2F2', color: '#DC2626', border: 'none',
                            borderRadius: 6, padding: '6px 14px', fontSize: 12,
                            fontWeight: 700, cursor: 'pointer',
                          }}>
                            🗑️ 削除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
