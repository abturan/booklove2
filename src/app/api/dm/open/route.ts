// src/app/api/dm/open/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function order(a: string, b: string) {
  return a < b ? [a, b] : [b, a]
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = session.user.id

  const url = new URL(req.url)
  const peerId = url.searchParams.get('peerId') || ''
  if (!peerId || peerId === me) return NextResponse.json({ error: 'Bad Request' }, { status: 400 })

  const peer = await prisma.user.findUnique({
    where: { id: peerId },
    select: { id: true, name: true, username: true, avatarUrl: true },
  })

  if (!peer) {
    const thread = await prisma.dmThread.findFirst({
      where: { id: peerId, OR: [{ userAId: me }, { userBId: me }] },
      select: {
        id: true,
        userAId: true,
        userBId: true,
        userA: { select: { id: true, name: true, username: true, avatarUrl: true } },
        userB: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    })
    if (!thread) return NextResponse.json({ error: 'Not Found' }, { status: 404 })

    const other = thread.userAId === me ? thread.userB : thread.userA
    const messages = await prisma.dmMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: { id: true, body: true, createdAt: true, authorId: true },
    })
    return NextResponse.json({ threadId: thread.id, peer: other, messages })
  }

  const [a, b] = order(me, peer.id)

  let thread = await prisma.dmThread.findUnique({
    where: { userAId_userBId: { userAId: a, userBId: b } },
  })
  if (!thread) {
    thread = await prisma.dmThread.create({ data: { userAId: a, userBId: b } })
  }

  const messages = await prisma.dmMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: 'asc' },
    take: 200,
    select: { id: true, body: true, createdAt: true, authorId: true },
  })

  return NextResponse.json({ threadId: thread.id, peer, messages })
}
