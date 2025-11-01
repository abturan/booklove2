// src/app/api/dm/send/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { dmEmitter } from '@/lib/realtime'
import { getFollowRelation } from '@/lib/follow'

function order(a: string, b: string) {
  return a < b ? [a, b] : [b, a]
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = session.user.id

  const { threadId, peerId, body } = await req.json().catch(() => ({}))
  if (!(body && typeof body === 'string' && body.trim().length > 0)) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }

  let tid = threadId as string | undefined
  let peer = peerId as string | undefined
  let thread:
    | { id: string; userAId: string; userBId: string; status: 'ACTIVE' | 'REQUESTED' | 'ARCHIVED'; requestedById: string | null; requestedAt: Date | null }
    | null = null

  if (!tid) {
    if (!peer || peer === me) return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
    const [a, b] = order(me, peer)
    thread = await prisma.dmThread.upsert({
      where: { userAId_userBId: { userAId: a, userBId: b } },
      update: {},
      create: {
        userAId: a,
        userBId: b,
        status: 'REQUESTED',
        requestedById: me,
        requestedAt: new Date(),
      },
      select: { id: true, userAId: true, userBId: true, status: true, requestedById: true, requestedAt: true },
    })
    tid = thread.id
  } else {
    thread = await prisma.dmThread.findFirst({
      where: { id: tid, OR: [{ userAId: me }, { userBId: me }] },
      select: { id: true, userAId: true, userBId: true, status: true, requestedById: true, requestedAt: true },
    })
    if (!thread) return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    peer = thread.userAId === me ? thread.userBId : thread.userAId
  }

  if (!peer) return NextResponse.json({ error: 'Bad Request' }, { status: 400 })

  const relation = await getFollowRelation(me, peer)
  const now = new Date()

  if (relation === 'mutual') {
    if (thread.status !== 'ACTIVE') {
      await prisma.dmThread.update({
        where: { id: tid },
        data: {
          status: 'ACTIVE',
          requestedById: null,
          requestedAt: null,
          lastDecisionAt: now,
        },
      })
      thread.status = 'ACTIVE'
    }
  } else {
    await prisma.dmThread.update({
      where: { id: tid },
      data: {
        status: 'REQUESTED',
        requestedById: me,
        requestedAt: now,
      },
    })
  }

  const msg = await prisma.dmMessage.create({
    data: { threadId: tid!, authorId: me, body: body.trim() },
    select: { id: true, body: true, createdAt: true, authorId: true, threadId: true },
  })

  await prisma.dmThread.update({ where: { id: tid! }, data: { lastMessage: new Date() } })

  dmEmitter.emit('message', { threadId: tid!, message: msg })

  return NextResponse.json({ ok: true, message: msg })
}
