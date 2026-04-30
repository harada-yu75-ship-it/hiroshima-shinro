import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    const auth = request.cookies.get('admin_auth')?.value
    if (auth !== process.env.ADMIN_PASSWORD) {
      if (pathname === '/admin/login') return NextResponse.next()
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
