// src/app/api/dm/peers/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'UNAUTHORIZED' }, { status: 401 })
  }
  const meId = session.user.id
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').toLowerCase().trim()

  const frs = await prisma.friendRequest.findMany({
    where: { status: 'ACCEPTED', OR: [{ fromId: meId }, { toId: meId }] },
    select: {
      fromId: true,
      toId: true,
      from: { select: { id: true, name: true, username: true, avatarUrl: true } },
      to:   { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const map = new Map<string, { id: string; name: string | null; username: string | null; avatarUrl: string | null }>()
  for (const fr of frs) {
    const peer = fr.fromId === meId ? fr.to : fr.from
    if (peer && !map.has(peer.id)) {
      map.set(peer.id, { id: peer.id, name: peer.name, username: peer.username, avatarUrl: peer.avatarUrl })
    }
  }

  let items = Array.from(map.values())
  if (q) {
    items = items.filter(p => (p.name || '').toLowerCase().includes(q) || (p.username || '').toLowerCase().includes(q))
  }
  items = items.slice(0, 50)

  return NextResponse.json({ ok: true, items })
}
