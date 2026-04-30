'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/admin')
    } else {
      setError('パスワードが違います')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#F5F7FA',
    }}>
      <div style={{
        background: 'white', borderRadius: 12,
        padding: '40px 48px', boxShadow: '0 4px 24px rgba(0,0,0,.10)',
        width: '100%', maxWidth: 360,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1a2742' }}>管理者ログイン</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>広島市進路情報サイト</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="パスワードを入力"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '10px 14px',
              border: '1.5px solid #E5E7EB', borderRadius: 8,
              fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        {error && (
          <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
            {error}
          </div>
        )}
        <button
          onClick={handleLogin}
          disabled={loading || !password}
          style={{
            width: '100%', padding: '10px',
            background: loading || !password ? '#9CA3AF' : '#1a2742',
            color: 'white', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 700, cursor: loading || !password ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </div>
    </div>
  )
}
