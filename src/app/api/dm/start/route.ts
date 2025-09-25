// src/app/api/dm/start/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function orderIds(a: string, b: string) {
  return a < b ? [a, b] as const : [b, a] as const
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id

  const { peerId } = await req.json().catch(() => ({}))
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

  const thread = await prisma.dmThread.upsert({
    where: { u1Id_u2Id: { u1Id, u2Id } },
    update: {},
    create: { u1Id, u2Id },
  })

  return NextResponse.json({ ok: true, threadId: thread.id })
}
