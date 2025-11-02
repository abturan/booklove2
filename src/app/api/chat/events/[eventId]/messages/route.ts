import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notify'
import { alertChatMessage, alertError } from '@/lib/adminAlert'

export const dynamic = 'force-dynamic'

async function resolveEvent(eventId: string) {
  if (!eventId) return null
  return prisma.clubEvent.findUnique({
    where: { id: eventId },
    select: { id: true, clubId: true, club: { select: { id: true, moderatorId: true, slug: true, name: true } } },
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
    const session = await auth()
    const { event, room } = await findRoom(params.eventId)
    if (!room || !event) return NextResponse.json({ items: [] })

    const viewerId = session?.user?.id ?? null
    const isAdmin = session?.user?.role === 'ADMIN'
    const isModerator = !!(viewerId && event.club?.moderatorId === viewerId)
    let isMember = false

    if (!isAdmin && !isModerator && viewerId) {
      const membership = await prisma.membership.findUnique({
        where: { userId_clubEventId: { userId: viewerId, clubEventId: event.id } },
        select: { isActive: true },
      })
      isMember = !!membership?.isActive
    }

    const canSeeSecret = isAdmin || isModerator || isMember

    const items = await prisma.chatMessage.findMany({
      where: { roomId: room.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { author: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } } },
    })

    const responseItems = items.map((item) => {
      const secretMasked = item.isSecret && !canSeeSecret
      return {
        ...item,
        body: secretMasked ? '**** Gizli mesaj' : item.body,
        isSecret: item.isSecret,
        secretMasked,
      }
    })

    return NextResponse.json({ items: responseItems })
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

    const isAdmin = session.user.role === 'ADMIN'
    const isModerator = event.club.moderatorId === session.user.id
    let canPost = isAdmin

    if (!canPost && isModerator) {
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

    const payload = await req.json()
    const body = typeof payload?.body === 'string' ? payload.body : ''
    if (!body.trim()) {
      return NextResponse.json({ ok: false, error: 'Mesaj boş olamaz.' }, { status: 400 })
    }

    const wantsSecret = !!payload?.isSecret
    const allowSecret = isAdmin || isModerator
    const isSecret = allowSecret && wantsSecret

    const msg = await prisma.chatMessage.create({
      data: { roomId: room.id, authorId: session.user.id, body: body.trim(), isSecret },
      include: { author: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } } },
    })

    // Notify event members if moderator posted
    try {
      if (isModerator) {
        const members = await prisma.membership.findMany({
          where: { clubEventId: event.id, isActive: true, userId: { not: session.user.id } },
          select: { userId: true },
        })
        if (members.length > 0) {
          const type = isSecret ? 'club_moderator_secret' : 'club_moderator_post'
          const payloadObj = {
            clubId: event.clubId,
            eventId: event.id,
            url: `/clubs/${event.club?.slug || ''}`,
            byId: session.user.id,
            clubName: event.club?.name || 'Kulüp',
            body: body.trim(),
            isSecret,
          }
          const payload = JSON.stringify(payloadObj)
          await prisma.notification.createMany({
            data: members.map((m) => ({ userId: m.userId, type, payload })),
            skipDuplicates: false,
          })
          // email
          const { sendNotificationEmail } = await import('@/lib/notify-email')
          for (const m of members) {
            sendNotificationEmail(m.userId, type as any, payloadObj).catch(() => {})
          }
        }
      }
    } catch (err) {
      console.error('chat notify error', err)
    }

    try { alertChatMessage({ userId: session.user.id, clubId: event.clubId, eventId: event.id, clubName: event.club?.name, body: body.trim(), isSecret }).catch(() => {}) } catch {}

    return NextResponse.json({ ok: true, item: msg })
  } catch (err: any) {
    console.error('chat POST error', err)
    try { alertError('chat_message', err).catch(() => {}) } catch {}
    return NextResponse.json({ ok: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}
