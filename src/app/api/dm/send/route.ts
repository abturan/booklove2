// src/app/api/dm/send/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { dmEmitter } from '@/lib/realtime'

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
  if (!tid) {
    if (!peerId || peerId === me) return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
    const [a, b] = order(me, peerId)
    const t = await prisma.dmThread.upsert({
      where: { userAId_userBId: { userAId: a, userBId: b } },
      update: {},
      create: { userAId: a, userBId: b },
      select: { id: true },
    })
    tid = t.id
  }

  const msg = await prisma.dmMessage.create({
    data: { threadId: tid!, authorId: me, body: body.trim() },
    select: { id: true, body: true, createdAt: true, authorId: true, threadId: true },
  })

  await prisma.dmThread.update({ where: { id: tid! }, data: { lastMessage: new Date() } })

  dmEmitter.emit('message', { threadId: tid!, message: msg })

  return NextResponse.json({ ok: true, message: msg })
}
