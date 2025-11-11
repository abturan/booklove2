// src/app/api/meet/token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEventWithClub, isMeetingFeatureEnabled, isMember, isModerator, isWithinOpenWindow } from '@/lib/meet'
import { buildJaasJwt, getJaasEnv, makeFullRoomName, makeJaasRoomSlug } from '@/lib/jaas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (!isMeetingFeatureEnabled()) return NextResponse.json({ error: 'Meeting disabled' }, { status: 404 })
    const env = getJaasEnv()
    if (!env) return NextResponse.json({ error: 'Meeting disabled' }, { status: 400 })
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => null)
    const eventId = String(body?.eventId || '')
    if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

    const ev = await getEventWithClub(eventId)
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (!ev.club.conferenceEnabled) return NextResponse.json({ error: 'Conference disabled' }, { status: 403 })

    // Must be moderator or active member
    const role = (session.user.role || '').toUpperCase()
    const mod = role === 'ADMIN' || role === 'MODERATOR' || (await isModerator(session.user.id, eventId))
    const member = await isMember(session.user.id, eventId)
    if (!mod && !member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Meeting must be active and within open window
    const meeting = await prisma.meeting.findUnique({ where: { clubEventId: ev.id } })
    if (!meeting?.isActive) return NextResponse.json({ error: 'Meeting inactive' }, { status: 409 })
    if (!isWithinOpenWindow(ev.startsAt)) return NextResponse.json({ error: 'Meeting not open yet' }, { status: 425 })

    const slug = makeJaasRoomSlug(ev.id)
    const roomName = makeFullRoomName(env, slug)
    const jwt = buildJaasJwt(env, {
      roomSlug: slug,
      user: {
        id: session.user.id,
        name: session.user.name || session.user.username || undefined,
        email: (session.user as any)?.email || undefined,
        avatarUrl: session.user.avatarUrl || undefined,
      },
      isModerator: mod,
    })

    return NextResponse.json({
      status: 'ok',
      domain: env.domain,
      scriptUrl: env.scriptUrl,
      roomName,
      roomSlug: slug,
      jwt,
      displayName: session.user.name || session.user.username || 'Katılımcı',
      email: (session.user as any)?.email || null,
      avatarUrl: session.user.avatarUrl || null,
      isModerator: mod,
      subject: ev.title,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
