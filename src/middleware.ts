import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'hs_admin'
const REALM = 'hiroshima-shinro admin'

async function tokenFor(password: string): Promise<string> {
  const data = new TextEncoder().encode('hiroshima-shinro:' + password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function unauthorized() {
  return new NextResponse('認証が必要です', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
    },
  })
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 指摘フォームからの投稿（POST）は認証なしで通す
  if (pathname === '/api/reports' && req.method === 'POST') {
    return NextResponse.next()
  }

  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    return new NextResponse(
      'ADMIN_PASSWORD が設定されていません。Vercelの環境変数を確認してください。',
      { status: 500 }
    )
  }

  const token = await tokenFor(password)

  // 一度認証済みならクッキーで通す
  if (req.cookies.get(COOKIE_NAME)?.value === token) {
    return NextResponse.next()
  }

  const header = req.headers.get('authorization')
  if (header && header.startsWith('Basic ')) {
    let decoded = ''
    try {
      decoded = atob(header.slice(6))
    } catch {
      return unauthorized()
    }
    const sep = decoded.indexOf(':')
    const inputPassword = sep >= 0 ? decoded.slice(sep + 1) : ''

    if (inputPassword === password) {
      const res = NextResponse.next()
      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 12, // 12時間
      })
      return res
    }
  }

  return unauthorized()
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/reports',
  ],
}
