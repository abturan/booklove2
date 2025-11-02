// src/app/api/phone/verify/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { code } = await req.json().catch(() => ({}))
  if (!code || !/^\d{6}$/.test(String(code))) return NextResponse.json({ error: 'Geçerli bir kod girin' }, { status: 400 })
  const userId = session.user.id
  const row = await (prisma as any).phoneVerification.findFirst({ where: { userId, verifiedAt: null }, orderBy: { createdAt: 'desc' } })
  if (!row) return NextResponse.json({ error: 'Kod bulunamadı' }, { status: 404 })
  if (row.expiresAt < new Date()) return NextResponse.json({ error: 'Kodun süresi dolmuş' }, { status: 400 })
  if (row.code !== String(code)) {
    await (prisma as any).phoneVerification.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } })
    return NextResponse.json({ error: 'Kod hatalı' }, { status: 400 })
  }
  await prisma.$transaction([
    (prisma as any).phoneVerification.update({ where: { id: row.id }, data: { verifiedAt: new Date() } }),
    (prisma as any).user.update({ where: { id: userId }, data: { phone: row.phone, phoneVerifiedAt: new Date() } }),
  ])
  return NextResponse.json({ ok: true })
}
