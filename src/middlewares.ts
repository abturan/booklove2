// src/middleware.ts
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * ÖNEMLİ:
 * 1) Dosya adı "middleware.ts" olmalı (tekil). Next.js "middlewares.ts" dosyasını çalıştırmaz.
 * 2) PayTR callback, ok/fail ve statik dosyalar kesinlikle MIDDLEWARE'e takılmamalı.
 * 3) Sadece /profile altını korumak istiyorsan matcher'ı dar tutmak en kolayıdır.
 *
 * Aşağıdaki middleware:
 * - /api/paytr/callback, /paytr/ok, /paytr/fail, statikler → her zaman BYPASS
 * - /profile/** → auth zorunlu (token yoksa login'e yönlendirir)
 * - Diğer tüm path'ler → BYPASS
 */

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // 1) BYPASS listesi: PayTR ve public yollar
  if (
    pathname.startsWith('/api/paytr/callback') ||
    pathname.startsWith('/paytr/ok') ||
    pathname.startsWith('/paytr/fail') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next()
  }

  // 2) Sadece /profile altında auth kontrolü yap
  if (!pathname.startsWith('/profile')) {
    return NextResponse.next()
  }

  // 3) /profile/** için next-auth doğrulaması
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET as string,
    salt: process.env.AUTH_SALT as string, // next-auth v5+ için gerekli
  })

  if (!token) {
    // Kullanıcıyı login'e at; dönüşte geldiği sayfaya yönlendirebilmek için callbackUrl ekleyelim
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    const callbackUrl = pathname + (search || '')
    url.searchParams.set('callbackUrl', callbackUrl)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

/**
 * Matcher açıklaması:
 * - Yalnızca /profile/** isteklerinde çalışır (performans ve güvenlik için en kolayı).
 * - PayTR callback’i zaten BYPASS edildiğinden global matcher’a da geçebilirsiniz;
 *   ama /profile/** yeterli olduğundan dar matcher tercih edildi.
 */
export const config = {
  matcher: ['/profile/:path*'],
}






