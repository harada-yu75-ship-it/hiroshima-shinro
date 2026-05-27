'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  return (
    <header style={{
      background: 'var(--navy)',
      color: 'white',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 20px rgba(0,0,0,.3)',
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        height: 60,
      }}>
        <span style={{
          background: 'var(--red)',
          color: 'white',
          fontWeight: 900,
          fontSize: 10,
          letterSpacing: '.06em',
          padding: '4px 8px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
        }}>
          HIROSHIMA
        </span>
        <Link href="/" style={{
          fontSize: 17, fontWeight: 700, letterSpacing: '.04em',
          color: 'white', textDecoration: 'none',
        }}>
          進路情報サイト
        </Link>
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          <Link href="/" style={{
            fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
            color: pathname === '/' ? 'white' : 'rgba(255,255,255,.6)',
            background: pathname === '/' ? 'rgba(255,255,255,.15)' : 'none',
            textDecoration: 'none',
          }}>
            🏫 学校一覧
          </Link>
          <Link href="/calendar" style={{
            fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
            color: pathname === '/calendar' ? 'white' : 'rgba(255,255,255,.6)',
            background: pathname === '/calendar' ? 'rgba(255,255,255,.15)' : 'none',
            textDecoration: 'none',
          }}>
            📅 カレンダー
          </Link>
        </div>
        <span style={{
          marginLeft: 'auto',
          fontSize: 11,
          color: 'rgba(255,255,255,.45)',
          display: 'var(--header-sub-display, block)',
        }}>
          広島市中学生向け｜オープンスクール・学校説明会情報
        </span>
      </div>
    </header>
  )
}
