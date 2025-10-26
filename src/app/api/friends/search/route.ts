// src/app/api/friends/search/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const me = session.user.id

  const { searchParams } = new URL(req.url)
  const q = String(searchParams.get('q') || '').trim()
  const take = Math.min(Number(searchParams.get('take') || 20), 50)

  const links = await prisma.friendRequest.findMany({
    where: { status: 'ACCEPTED', OR: [{ fromId: me }, { toId: me }] },
    select: { fromId: true, toId: true },
  })

  if (links.length === 0) return NextResponse.json({ items: [] })

  const peerIds = Array.from(
    new Set(links.map(l => (l.fromId === me ? l.toId : l.fromId)))
  )

  const users = await prisma.user.findMany({
    where: {
      id: { in: peerIds },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { username: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: { id: true, name: true, username: true, avatarUrl: true },
    orderBy: [{ name: 'asc' }, { username: 'asc' }],
    take,
  })

  return NextResponse.json({ items: users })
}
