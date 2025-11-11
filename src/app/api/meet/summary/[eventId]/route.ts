// src/app/api/meet/summary/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEventWithClub } from '@/lib/meet'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Public summary for club page: limited info, no auth required
export async function GET(_req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const eventId = String(params?.eventId || '')
    if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })
    const ev = await getEventWithClub(eventId)
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (!ev.club.conferenceEnabled) return NextResponse.json({ error: 'Conference disabled' }, { status: 403 })

    const meeting = await prisma.meeting.findUnique({ where: { clubEventId: ev.id }, select: { isActive: true } })

    const pres = await prisma.meetingPresence.findMany({
      where: { clubEventId: ev.id },
      select: {
        userId: true,
        joinedAt: true,
        lastSeenAt: true,
        leftAt: true,
        user: { select: { name: true, username: true, slug: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: 'asc' },
    })

    const now = Date.now()
    const onlineWindow = 2 * 60 * 1000
    const present = pres.filter((p) => !p.leftAt && now - p.lastSeenAt.getTime() <= onlineWindow)
    const presentOut = present.map((p) => ({
      userId: p.userId,
      name: p.user?.name || 'Katılımcı',
      handle: p.user?.username || p.user?.slug || p.userId.slice(0, 6),
      avatarUrl: p.user?.avatarUrl || null,
      joinedAt: p.joinedAt.toISOString(),
    }))

    const members = await prisma.membership.findMany({ where: { clubEventId: ev.id, isActive: true }, select: { userId: true } })
    const presentIds = new Set(present.map((p) => p.userId))
    const absentCount = members.filter((m) => !presentIds.has(m.userId)).length
    const moderatorOnline = presentIds.has(ev.club.moderatorId)
    const liveNow = presentOut.length > 0
    const meetingActive = meeting?.isActive || false

    return NextResponse.json({ present: presentOut, absentCount, meetingActive, moderatorOnline, meetingLive: liveNow })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
