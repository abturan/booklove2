import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function resolveEvent(eventId: string) {
  if (!eventId) return null
  return prisma.clubEvent.findUnique({
    where: { id: eventId },
    select: { id: true, clubId: true, club: { select: { moderatorId: true } } },
  })
}

async function ensureRoom(eventId: string) {
  const event = await resolveEvent(eventId)
  if (!event) return { event: null, room: null }

  let room = await prisma.chatRoom.findUnique({ where: { clubEventId: event.id } })
  if (!room) {
    room = await prisma.chatRoom.create({
      data: { clubEventId: event.id },
    })
  }
  return { event, room }
}

async function findRoom(eventId: string) {
  const event = await resolveEvent(eventId)
  if (!event) return { event: null, room: null }
  const room = await prisma.chatRoom.findUnique({ where: { clubEventId: event.id } })
  return { event, room }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    const { room } = await findRoom(params.eventId)
    if (!room) return NextResponse.json({ items: [] })

    const items = await prisma.chatMessage.findMany({
      where: { roomId: room.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { author: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } } },
    })

    return NextResponse.json({ items })
  } catch (err: any) {
    console.error('chat GET error', err)
    return NextResponse.json({ items: [] }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Giriş gerekli.' }, { status: 401 })
    }

    const { event, room } = await ensureRoom(params.eventId)
    if (!room || !event) {
      return NextResponse.json({ ok: false, error: 'Etkinlik bulunamadı.' }, { status: 404 })
    }

    let canPost = session.user.role === 'ADMIN'

    if (!canPost && event.club.moderatorId === session.user.id) {
      canPost = true
    }

    if (!canPost) {
      const membership = await prisma.membership.findUnique({
        where: { userId_clubEventId: { userId: session.user.id, clubEventId: event.id } },
        select: { isActive: true },
      })
      canPost = !!membership?.isActive
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
      include: { author: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } } },
    })

    return NextResponse.json({ ok: true, item: msg })
  } catch (err: any) {
    console.error('chat POST error', err)
    return NextResponse.json({ ok: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}
