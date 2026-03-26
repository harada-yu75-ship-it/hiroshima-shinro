'use client'

export default function SkeletonCard() {
  return (
    <div style={{
      background: 'white',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      <div style={{ height: 4, background: '#E4E4E4' }} />
      <div style={{ padding: '16px 18px 14px' }}>
        <div className="skeleton" style={{ height: 18, width: 80, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 20, width: '70%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: 10, background: 'var(--cream)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: 10 }}>
            <div style={{ minWidth: 44 }}>
              <div className="skeleton" style={{ height: 10, marginBottom: 4 }} />
              <div className="skeleton" style={{ height: 24 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 14, marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 11, width: '60%' }} />
            </div>
          </div>
          <div style={{ padding: 10, background: 'var(--cream)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: 10 }}>
            <div style={{ minWidth: 44 }}>
              <div className="skeleton" style={{ height: 10, marginBottom: 4 }} />
              <div className="skeleton" style={{ height: 24 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 14, marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 11, width: '50%' }} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: 12, width: 70 }} />
        <div className="skeleton" style={{ height: 12, width: 60 }} />
      </div>
    </div>
  )
}
