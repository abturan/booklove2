// src/app/api/subscriptions/activate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const clubSlug = String(body?.clubSlug || '').trim()
    if (!clubSlug) return NextResponse.json({ ok: false, error: 'Eksik kulüp' }, { status: 400 })

    const club = await prisma.club.findUnique({ where: { slug: clubSlug }, select: { id: true } })
    if (!club) return NextResponse.json({ ok: false, error: 'Kulüp bulunamadı' }, { status: 404 })

    const userId = session.user.id
    const clubId = club.id

    await prisma.subscription.upsert({
      where: { userId_clubId: { userId, clubId } },
      update: { active: true, startedAt: new Date(), canceledAt: null },
      create: { userId, clubId, active: true, startedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Sunucu hatası' }, { status: 500 })
  }
}
