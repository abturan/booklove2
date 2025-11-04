// src/app/api/meet/list/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEventWithClub, isMeetingFeatureEnabled, isModerator } from '@/lib/meet'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    if (!isMeetingFeatureEnabled()) return NextResponse.json({ error: 'Meeting disabled' }, { status: 404 })
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const eventId = String(params?.eventId || '')
    if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })
    const ev = await getEventWithClub(eventId)
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    const role = (session.user.role || '').toUpperCase()
    const mod = role === 'ADMIN' || role === 'MODERATOR' || (await isModerator(session.user.id, eventId))

    const pres = await prisma.meetingPresence.findMany({
      where: { clubEventId: ev.id },
      select: {
        userId: true,
        joinedAt: true,
        lastSeenAt: true,
        leftAt: true,
        allowSpeak: true,
        user: { select: { name: true, username: true, slug: true } },
      },
      orderBy: { joinedAt: 'asc' },
    })
    const members = await prisma.membership.findMany({ where: { clubEventId: ev.id, isActive: true }, select: { userId: true } })
    const memberIds = new Set(members.map((m) => m.userId))

    const now = Date.now()
    const onlineWindow = 2 * 60 * 1000
    const present = pres.filter((p) => !p.leftAt && now - p.lastSeenAt.getTime() <= onlineWindow)
    const presentIds = new Set(present.map((p) => p.userId))
    const absentIds = [...memberIds].filter((id) => !presentIds.has(id))
    return NextResponse.json({
      present: present.map((p) => ({
        userId: p.userId,
        name: p.user?.name || 'Katılımcı',
        handle: p.user?.username || p.user?.slug || p.userId.slice(0, 6),
        allowSpeak: p.allowSpeak,
        joinedAt: p.joinedAt.toISOString(),
      })),
      absentCount: absentIds.length,
      isModerator: mod,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
