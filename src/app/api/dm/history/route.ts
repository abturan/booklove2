// src/app/api/dm/history/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function orderIds(a: string, b: string) {
  return a < b ? [a, b] as const : [b, a] as const
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id

  const url = new URL(req.url)
  const peerId = url.searchParams.get('peerId') || ''
  const cursor = url.searchParams.get('cursor') || ''
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50)

  if (!peerId || peerId === meId) return NextResponse.json({ ok: false, error: 'Geçersiz kullanıcı' }, { status: 400 })

  const isFriend = await prisma.friendRequest.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [{ fromId: meId, toId: peerId }, { fromId: peerId, toId: meId }],
    },
    select: { id: true },
  })
  if (!isFriend) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

  const [u1Id, u2Id] = orderIds(meId, peerId)
  const thread = await prisma.dmThread.findUnique({ where: { u1Id_u2Id: { u1Id, u2Id } }, select: { id: true } })
  if (!thread) return NextResponse.json({ ok: true, items: [], nextCursor: null })

  const items = await prisma.dmMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, authorId: true, body: true, createdAt: true },
  })

  const hasMore = items.length > limit
  const sliced = hasMore ? items.slice(0, limit) : items
  const nextCursor = hasMore ? sliced[sliced.length - 1]?.id ?? null : null

  return NextResponse.json({ ok: true, items: sliced.reverse(), nextCursor })
}
