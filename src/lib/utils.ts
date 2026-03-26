/**
 * Haversine公式で2点間の直線距離（km）を計算する
 */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * 日付文字列（YYYY-MM-DD）を日本語表示に変換
 */
export function formatDateJa(dateStr: string): {
  year: number
  month: number
  day: number
  weekday: string
  display: string
} {
  const dt = new Date(dateStr + 'T00:00:00')
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  return {
    year: dt.getFullYear(),
    month: dt.getMonth() + 1,
    day: dt.getDate(),
    weekday: weekdays[dt.getDay()],
    display: `${dt.getMonth() + 1}月${dt.getDate()}日（${weekdays[dt.getDay()]}）`,
  }
}

/**
 * 今日以降の日程かどうかを判定（当日含む）
 */
export function isFutureOrToday(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dt = new Date(dateStr + 'T00:00:00')
  return dt >= today
}

/**
 * 学校種別の日本語ラベル
 */
export function schoolTypeLabel(type: string): string {
  return { high: '全日制高校', tsushin: '通信制高校', senmon: '専門学校' }[type] ?? ''
}

/**
 * 距離を表示用文字列に変換
 */
export function formatDistance(km: number | null): string {
  if (km === null) return '—'
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}
