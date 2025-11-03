import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Yetkisiz' }, { status: 401 })
  }
  const userId = session.user.id
  try {
    const { newPassword } = await req.json()
    if (!newPassword || String(newPassword).length < 6) {
      return NextResponse.json({ ok: false, error: 'Yeni şifre en az 6 karakter olmalı.' }, { status: 400 })
    }
    const pending = await prisma.passwordResetToken.findFirst({ where: { userId, usedAt: null, expiresAt: { gt: new Date() } } })
    if (!pending) {
      return NextResponse.json({ ok: false, error: 'Şifre sıfırlama talebi bulunamadı.' }, { status: 400 })
    }
    const hash = await bcrypt.hash(String(newPassword), 10)
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } }),
      prisma.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
    ])
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'İşlem hatası' }, { status: 500 })
  }
}

