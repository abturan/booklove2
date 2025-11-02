// src/app/api/auth/verify-email/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const token = searchParams.get('token') || ''
  if (!token) return NextResponse.json({ ok: false, error: 'Token yok' }, { status: 400 })

  const row = await (prisma as any).emailVerificationToken.findUnique({ where: { token } })
  if (!row) return NextResponse.json({ ok: false, error: 'Token geçersiz' }, { status: 400 })
  if (row.consumedAt) return NextResponse.json({ ok: true, already: true })
  if (row.expiresAt < new Date()) return NextResponse.json({ ok: false, error: 'Token süresi dolmuş' }, { status: 400 })

  await prisma.$transaction([
    (prisma as any).user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }),
    (prisma as any).emailVerificationToken.update({ where: { id: row.id }, data: { consumedAt: new Date() } }),
  ])

  const redirect = `${origin}/?verified=1`
  return new Response(null, { status: 302, headers: { Location: redirect } })
}
