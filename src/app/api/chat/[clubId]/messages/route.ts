// src/app/api/chat/[clubId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const room = await prisma.chatRoom.findFirst({ where: { clubId: params.clubId } })
  if (!room) return NextResponse.json({ items: [] })

  const items = await prisma.chatMessage.findMany({
    where: { roomId: room.id },
    orderBy: { createdAt: 'asc' },
    take: 200,
    include: { author: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } } }
  })

  return NextResponse.json({ items })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Giriş gerekli.' }, { status: 401 })
  }

  const room = await prisma.chatRoom.upsert({
    where: { clubId: params.clubId },
    update: {},
    create: { clubId: params.clubId },
  })

  let canPost = session.user.role === 'ADMIN'

  if (!canPost) {
    const membership = await prisma.membership.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId: params.clubId } },
      select: { isActive: true }
    })
    canPost = !!membership?.isActive
  }

  if (!canPost) {
    const club = await prisma.club.findUnique({
      where: { id: params.clubId },
      select: { moderatorId: true }
    })
    if (club?.moderatorId === session.user.id) {
      canPost = true
    }
  }

  if (!canPost) {
    return NextResponse.json({ ok: false, error: 'Abonelik gerekli.' }, { status: 403 })
  }

  const { body } = await req.json()
  if (typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ ok: false, error: 'Mesaj boş olamaz.' }, { status: 400 })
  }

  const msg = await prisma.chatMessage.create({
    data: { roomId: room.id, authorId: session.user.id, body: body.trim() },
    include: { author: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } } }
  })

  return NextResponse.json({ ok: true, item: msg })
}
