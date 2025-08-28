// src/middlewares.ts
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET as string,
    salt: process.env.AUTH_SALT as string, // yeni sürümde gerekli
  })

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/profile/:path*'], // sadece profili koru
}
