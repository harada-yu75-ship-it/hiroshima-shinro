export type ApplicationBadge = {
  label: string
  bg: string
  color: string
  border: string
  href?: string
}

export function getApplicationBadge(
  requiresApplication: boolean | null,
  applicationUrl: string | null | undefined,
): ApplicationBadge | null {
  if (!requiresApplication) return null

  if (applicationUrl) {
    return {
      label: '申込受付中',
      bg: '#DCFCE7',
      color: '#16A34A',
      border: '#86EFAC',
      href: applicationUrl,
    }
  }

  return {
    label: '申込はHPを参照',
    bg: '#F3F4F6',
    color: '#6B7280',
    border: '#D1D5DB',
  }
}
