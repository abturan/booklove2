// src/app/api/meet/allow/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEventWithClub, isMeetingFeatureEnabled, isModerator } from '@/lib/meet'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (!isMeetingFeatureEnabled()) return NextResponse.json({ error: 'Meeting disabled' }, { status: 404 })
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => null)
    const eventId = String(body?.eventId || '')
    const targetUserId = String(body?.userId || '')
    const allow = Boolean(body?.allow)
    if (!eventId || !targetUserId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const ev = await getEventWithClub(eventId)
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    const role = (session.user.role || '').toUpperCase()
    const mod = role === 'ADMIN' || role === 'MODERATOR' || (await isModerator(session.user.id, eventId))
    if (!mod) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.meetingPresence.update({
      where: { clubEventId_userId: { clubEventId: ev.id, userId: targetUserId } },
      data: { allowSpeak: allow },
    }).catch(() => {})
    return NextResponse.json({ status: 'ok' })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
