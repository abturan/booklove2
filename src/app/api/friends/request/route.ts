// src/app/api/friends/request/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id

  const { toUserId } = await req.json().catch(() => ({}))
  if (!toUserId || toUserId === meId) {
    return NextResponse.json({ ok: false, error: 'Geçersiz kullanıcı' }, { status: 400 })
  }

  const pair = await prisma.friendRequest.findMany({
    where: {
      OR: [
        { fromId: meId, toId: toUserId },
        { fromId: toUserId, toId: meId },
      ],
    },
    select: { fromId: true, toId: true, status: true, respondedAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const mine = pair.find(p => p.fromId === meId && p.toId === toUserId)
  if (mine) {
    if (mine.status === 'ACCEPTED' || mine.status === 'PENDING') {
      return NextResponse.json({ ok: true, already: true })
    }
  }

  const theirs = pair.find(p => p.fromId === toUserId && p.toId === meId)
  if (theirs) {
    if (theirs.status === 'ACCEPTED') {
      return NextResponse.json({ ok: true, already: true })
    }
    if (theirs.status === 'PENDING' && !theirs.respondedAt) {
      return NextResponse.json({ ok: true, already: true })
    }
    // PENDING + respondedAt != null → ben reddetmişim, göndermeme izin ver
  }

  await prisma.friendRequest.create({
    data: { fromId: meId, toId: toUserId, status: 'PENDING' },
  })

  return NextResponse.json({ ok: true })
}
