// src/app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()
    if (typeof token !== 'string' || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ ok: false, error: 'Geçersiz istek' }, { status: 400 })
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex')
    const rec = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hash } })
    if (!rec || rec.usedAt || rec.expiresAt < new Date()) {
      return NextResponse.json({ ok: false, error: 'Geçersiz veya süresi dolmuş bağlantı' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: rec.userId } })
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Kullanıcı bulunamadı' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { tokenHash: hash }, data: { usedAt: new Date() } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null, tokenHash: { not: hash } } }),
    ])

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}
