// src/app/api/dm/thread/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFollowRelation } from '@/lib/follow'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id

  const url = new URL(req.url)
  const threadId = url.searchParams.get('threadId') || ''
  if (!threadId) return NextResponse.json({ error: 'Bad Request' }, { status: 400 })

  const thread = await prisma.dmThread.findFirst({
    where: { id: threadId, OR: [{ userAId: meId }, { userBId: meId }] },
    select: {
      id: true,
      userAId: true,
      userBId: true,
      userA: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
      userB: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
      status: true,
      requestedById: true,
      requestedAt: true,
    },
  })
  if (!thread) return NextResponse.json({ error: 'Not Found' }, { status: 404 })

  const peer = thread.userAId === meId ? thread.userB : thread.userA
  const relation = await getFollowRelation(meId, peer.id)

  const baseMessages = await prisma.dmMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: 'asc' },
    take: 200,
    select: { id: true, body: true, createdAt: true, authorId: true },
  })

  // Reactions for messages (best-effort: ignore if table not migrated)
  const ids = baseMessages.map((m) => m.id)
  let messages = baseMessages as any[]
  if (ids.length > 0) {
    try {
      const grouped = await prisma.dmReaction.groupBy({ by: ['messageId', 'emoji'], where: { messageId: { in: ids } }, _count: { emoji: true } })
      const mineRows = await prisma.dmReaction.findMany({ where: { messageId: { in: ids }, userId: meId }, select: { messageId: true, emoji: true } })
      const countsById: Record<string, Record<string, number>> = {}
      for (const r of grouped) {
        const mid = (r as any).messageId as string
        const emj = (r as any).emoji as string
        const cnt = Number((r as any)?._count?.emoji || 0)
        if (!countsById[mid]) countsById[mid] = {}
        countsById[mid][emj] = cnt
      }
      const mineById: Record<string, string[]> = {}
      for (const r of mineRows) {
        if (!mineById[r.messageId]) mineById[r.messageId] = []
        mineById[r.messageId].push(r.emoji)
      }
      messages = baseMessages.map((m) => ({ ...m, reactions: countsById[m.id] || {}, mine: mineById[m.id] || [] }))
    } catch (_err) {
      // If dmReaction table/index is not deployed yet, fall back silently
      messages = baseMessages
    }
  }

  // Auto-reactivate archived/requested threads when relation becomes mutual
  let finalStatus = thread.status
  if (relation === 'mutual' && thread.status !== 'ACTIVE') {
    try {
      const updated = await prisma.dmThread.update({ where: { id: thread.id }, data: { status: 'ACTIVE', requestedById: null, requestedAt: null, lastDecisionAt: new Date() }, select: { status: true } })
      finalStatus = updated.status as any
    } catch {}
  }

  return NextResponse.json({
    threadId: thread.id,
    peer,
    status: finalStatus,
    requestedById: thread.requestedById,
    requestedAt: thread.requestedAt,
    relation,
    canMessage: relation === 'mutual',
    messages,
  })
}
