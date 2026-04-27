export type DeadlineBadge = {
  label: string
  bg: string
  color: string
  border: string
}

export function getDeadlineBadge(deadline: string | null | undefined): DeadlineBadge | null {
  if (!deadline) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(deadline)
  d.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)

  if (diff < 0) {
    return { label: '締切済', bg: '#F3F4F6', color: '#9CA3AF', border: '#E5E7EB' }
  }
  if (diff === 0) {
    return { label: '本日締切', bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' }
  }
  if (diff <= 3) {
    return { label: `あと ${diff} 日`, bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' }
  }
  if (diff <= 7) {
    return { label: `あと ${diff} 日`, bg: '#FEF9C3', color: '#CA8A04', border: '#FDE047' }
  }
  const m = d.getMonth() + 1
  const day = d.getDate()
  return { label: `締切 ${m}/${day}`, bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' }
}
