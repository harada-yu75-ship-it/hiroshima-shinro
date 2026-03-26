import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '広島市 進路情報サイト | オープンスクール・学校説明会',
  description: '広島県内の高等学校・通信制高校・専門学校のオープンスクール・学校説明会等、中学生向けイベント情報をまとめています。自分の中学校から近い順に検索できます。',
  keywords: ['広島', 'オープンスクール', '学校説明会', '高校', '専門学校', '通信制', '中学生', '進路'],
  openGraph: {
    title: '広島市 進路情報サイト',
    description: '広島県内の高校・専門学校のオープンスクール・学校説明会情報',
    locale: 'ja_JP',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a2744',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
