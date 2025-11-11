// src/app/api/meet/presence/ping/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEventWithClub, isMeetingFeatureEnabled } from '@/lib/meet'

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
    if (!ev || !ev.club.conferenceEnabled) return NextResponse.json({ error: 'Conference disabled' }, { status: 403 })
    await prisma.meetingPresence.update({
      where: { clubEventId_userId: { clubEventId: eventId, userId: session.user.id } },
      data: { lastSeenAt: new Date() },
    }).catch(() => {})
    return NextResponse.json({ status: 'ok' })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
