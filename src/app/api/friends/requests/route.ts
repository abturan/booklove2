// src/app/api/friends/requests/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/** GET: gelen/giden istekler */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id

  const incoming = await prisma.friendRequest.findMany({
    where: { toId: meId, status: 'PENDING' },
    select: { id: true, from: { select: { id: true, name: true, username: true, avatarUrl: true } }, createdAt: true }
  })

  const outgoing = await prisma.friendRequest.findMany({
    where: { fromId: meId, status: 'PENDING' },
    select: { id: true, to: { select: { id: true, name: true, username: true, avatarUrl: true } }, createdAt: true }
  })

  return NextResponse.json({ incoming, outgoing })
}

/** POST: davet gönder { toId } */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id

  const body = await req.json().catch(() => null)
  const toId = body?.toId as string | undefined
  if (!toId || toId === meId) return NextResponse.json({ error: 'Hatalı hedef' }, { status: 400 })

  // Zaten kabul edilmiş veya bekleyen var mı?
  const exists = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { fromId: meId, toId },
        { fromId: toId, toId: meId },
      ],
      status: { in: ['PENDING', 'ACCEPTED'] }
    },
    select: { id: true }
  })
  if (exists) return NextResponse.json({ ok: true }) // idempotent

  await prisma.friendRequest.create({ data: { fromId: meId, toId } })
  return NextResponse.json({ ok: true })
}
