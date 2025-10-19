// src/app/api/dm/threads/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = session.user.id

  const rows = await prisma.dmThread.findMany({
    where: { OR: [{ userAId: me }, { userBId: me }] },
    include: {
      userA: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
      userB: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
    },
    orderBy: { lastMessage: 'desc' },
  })

  const items = await Promise.all(
    rows.map(async (t) => {
      const peer = t.userAId === me ? t.userB : t.userA
      const last = await prisma.dmMessage.findFirst({
        where: { threadId: t.id },
        orderBy: { createdAt: 'desc' },
        select: { body: true, createdAt: true, authorId: true },
      })
      return { threadId: t.id, peer, last }
    })
  )

  return NextResponse.json({ items })
}
