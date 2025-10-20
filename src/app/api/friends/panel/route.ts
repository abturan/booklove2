// src/app/api/friends/panel/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const meId = session.user.id

  // ACCEPTED arkadaşlıklar (tekilleştir)
  const accepted = await prisma.friendRequest.findMany({
    where: { status: 'ACCEPTED', OR: [{ fromId: meId }, { toId: meId }] },
    include: {
      from: { select: { id: true, name: true, username: true, avatarUrl: true } },
      to:   { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
    orderBy: { respondedAt: 'desc' },
  })
  const friendsMap = new Map<string, any>()
  for (const r of accepted) {
    const other = r.fromId === meId ? r.to : r.from
    friendsMap.set(other.id, other)
  }
  const friends = Array.from(friendsMap.values())

  // Bekleyenler
  const incomingRaw = await prisma.friendRequest.findMany({
    where: { toId: meId, status: 'PENDING' },
    include: {
      from: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  const outgoingRaw = await prisma.friendRequest.findMany({
    where: { fromId: meId, status: 'PENDING' },
    include: {
      to: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const incoming = incomingRaw.map((r) => ({ id: r.id, from: r.from }))
  const outgoing = outgoingRaw.map((r) => ({ id: r.id, to: r.to }))

  return NextResponse.json({ friends, incoming, outgoing })
}
