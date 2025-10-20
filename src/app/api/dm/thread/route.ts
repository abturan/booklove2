// src/app/api/dm/thread/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      userA: { select: { id: true, name: true, username: true, avatarUrl: true } },
      userB: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  })
  if (!thread) return NextResponse.json({ error: 'Not Found' }, { status: 404 })

  const peer = thread.userAId === meId ? thread.userB : thread.userA

  const messages = await prisma.dmMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: 'asc' },
    take: 200,
    select: { id: true, body: true, createdAt: true, authorId: true },
  })

  return NextResponse.json({ threadId: thread.id, peer, messages })
}
