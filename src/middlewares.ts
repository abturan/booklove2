import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: any) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/profile/:path*'], // sadece profili koru
}
