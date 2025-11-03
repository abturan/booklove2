// src/app/api/friends/respond/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureFollow } from '@/lib/follow'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const meId = session.user.id
  const { threadId, action } = await req.json().catch(() => ({} as any))
  if (!threadId || !['ACCEPT', 'DECLINE'].includes(action)) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const thread = await prisma.dmThread.findFirst({
    where: { id: threadId, OR: [{ userAId: meId }, { userBId: meId }] },
    select: { id: true, status: true, requestedById: true, userAId: true, userBId: true },
  })
  if (!thread) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const peerId = thread.userAId === meId ? thread.userBId : thread.userAId

  const now = new Date()

  if (action === 'ACCEPT') {
    // Kabul: iki yönlü takip oluştur (karşılıklı takip)
    await ensureFollow({ followerId: meId, followingId: peerId })
    await ensureFollow({ followerId: peerId, followingId: meId })

    const updated = await prisma.dmThread.update({
      where: { id: thread.id },
      data: {
        status: 'ACTIVE',
        requestedById: null,
        requestedAt: null,
        lastDecisionAt: now,
      },
      select: { id: true },
    })
    return NextResponse.json({ ok: true, threadId: updated.id })
  }

  // DECLINE: Arşiv konseptini kaldırıyoruz. İsteği sonlandır, açık bekleyen istek görünmesin.
  await prisma.dmThread.update({
    where: { id: thread.id },
    data: {
      status: 'REQUESTED',
      requestedById: null,
      requestedAt: null,
      lastDecisionAt: now,
    },
  })
  return NextResponse.json({ ok: true })
}
