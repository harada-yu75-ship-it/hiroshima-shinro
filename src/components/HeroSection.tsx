'use client'

export default function HeroSection() {
  return (
    <>
      {/* ① デモモード・本格運用お知らせバナー */}
      <div style={{
        background: '#FFF8E7',
        borderBottom: '1px solid #F0C040',
        padding: '10px 20px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: 13, color: '#7A5000', lineHeight: 1.8, margin: 0 }}>
            <span style={{ fontWeight: 700, color: '#B8860B' }}>【現在はデモモードで公開中です】</span>　
            現在表示されているイベント情報はサンプルデータであり、実際の各校の情報とは異なります。
            <br />
            <span style={{ fontWeight: 700, color: '#2E75B6' }}>５月より本格運用開始予定。</span>　
            ４月末までデモモードで公開中です。５月以降は各校の実際のオープンスクール情報を自動収集・掲載します。
          </p>
        </div>
      </div>

      {/* ② ヒーローセクション */}
      <section style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 55%, #2C4A8A 100%)',
        color: 'white',
        padding: '44px 20px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 装飾円 */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(192,57,43,.15)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -50, left: '8%',
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(212,168,67,.10)', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <p style={{
            fontSize: 11, letterSpacing: '.15em',
            color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10,
          }}>
            2026年度 進路選択サポート
          </p>
          <h1 style={{
            fontSize: 'clamp(20px, 4vw, 32px)',
            fontWeight: 900, lineHeight: 1.3, marginBottom: 10,
          }}>
            広島県内の高校・専門学校<br />
            オープンスクール情報
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', maxWidth: 480, lineHeight: 1.8 }}>
            自分の中学校を起点に、近くの学校を距離で絞り込めます。<br />
            学校説明会・体験入学など、最新のイベント情報をまとめています。
          </p>
        </div>
      </section>
    </>
  )
}
