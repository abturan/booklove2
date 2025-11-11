// src/app/api/meet/activate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureMeeting, getEventWithClub, isMeetingFeatureEnabled, isModerator } from '@/lib/meet'

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
    if (!mod) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await ensureMeeting(eventId)
    const opensAt = new Date(ev.startsAt.getTime() - 10 * 60 * 1000)
    const meeting = await prisma.meeting.upsert({
      where: { clubEventId: ev.id },
      update: { isActive: true, opensAt },
      create: { clubEventId: ev.id, isActive: true, opensAt },
      select: { id: true, isActive: true, opensAt: true },
    })
    return NextResponse.json({ status: 'ok', meeting })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
