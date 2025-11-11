// src/app/api/meet/presence/enter/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureMeeting, getEventWithClub, isMeetingFeatureEnabled, isMember, isModerator, isWithinOpenWindow } from '@/lib/meet'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (!isMeetingFeatureEnabled()) return NextResponse.json({ error: 'Meeting disabled' }, { status: 404 })
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => null)
    const eventId = String(body?.eventId || '')
    if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

    const ev = await getEventWithClub(eventId)
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (!ev.club.conferenceEnabled) return NextResponse.json({ error: 'Conference disabled' }, { status: 403 })

    const role = (session.user.role || '').toUpperCase()
    const mod = role === 'ADMIN' || role === 'MODERATOR' || (await isModerator(session.user.id, eventId))
    const member = await isMember(session.user.id, eventId)
    if (!mod && !member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await ensureMeeting(eventId)
    const meeting = await prisma.meeting.findUnique({ where: { clubEventId: ev.id } })
    if (!meeting?.isActive) return NextResponse.json({ error: 'Meeting inactive' }, { status: 409 })
    if (!isWithinOpenWindow(ev.startsAt)) return NextResponse.json({ error: 'Not open yet' }, { status: 425 })

    const row = await prisma.meetingPresence.upsert({
      where: { clubEventId_userId: { clubEventId: ev.id, userId: session.user.id } },
      update: { lastSeenAt: new Date(), leftAt: null },
      create: { clubEventId: ev.id, userId: session.user.id },
      select: { id: true, allowSpeak: true },
    })
    return NextResponse.json({ status: 'ok', presenceId: row.id, allowSpeak: row.allowSpeak })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
