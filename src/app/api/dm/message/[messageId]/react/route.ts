// src/app/api/dm/message/[messageId]/react/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const ALLOWED = ['❤️','👍','😂','😮','😢','👏']

export async function POST(req: Request, { params }: { params: { messageId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  const me = session.user.id
  const { messageId } = params
  const body = await req.json().catch(() => null)
  const emoji = typeof body?.emoji === 'string' ? body.emoji : ''
  if (!ALLOWED.includes(emoji)) return NextResponse.json({ ok: false, error: 'bad_emoji' }, { status: 400 })

  // confirm message exists and belongs to a thread the user is part of
  const msg = await prisma.dmMessage.findUnique({ where: { id: messageId }, select: { id: true, threadId: true, thread: { select: { userAId: true, userBId: true } } } })
  if (!msg) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  const inThread = msg.thread.userAId === me || msg.thread.userBId === me
  if (!inThread) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  // toggle reaction
  const existing = await prisma.dmReaction.findUnique({ where: { messageId_userId_emoji: { messageId, userId: me, emoji } } })
  if (existing) {
    await prisma.dmReaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.dmReaction.create({ data: { messageId, userId: me, emoji } })
  }

  // return updated counts for message
  const rows = await prisma.dmReaction.groupBy({ by: ['emoji'], where: { messageId }, _count: { emoji: true } })
  const counts: Record<string, number> = {}
  for (const r of rows) counts[r.emoji] = Number(r._count.emoji || 0)
  const mineRows = await prisma.dmReaction.findMany({ where: { messageId, userId: me }, select: { emoji: true } })
  const mine = mineRows.map((r) => r.emoji)

  return NextResponse.json({ ok: true, counts, mine })
}

