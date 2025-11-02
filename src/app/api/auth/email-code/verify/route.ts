// src/app/api/auth/email-code/verify/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { email, code } = await req.json().catch(() => ({}))
  if (typeof email !== 'string' || typeof code !== 'string') {
    return NextResponse.json({ ok: false, message: 'Eksik alan' }, { status: 400 })
  }
  const row = await (prisma as any).emailVerificationToken.findFirst({
    where: { email, token: code, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!row) return NextResponse.json({ ok: false, message: 'Kod geçersiz veya süresi dolmuş.' }, { status: 400 })
  // Şimdilik burada consume etmiyoruz; kayıt sırasında consume ederiz.
  return NextResponse.json({ ok: true })
}

