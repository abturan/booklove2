// src/app/api/meet/token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEventWithClub, isMeetingFeatureEnabled, isMember, isModerator, isWithinOpenWindow } from '@/lib/meet'
import { buildLiveKitToken, getLiveKitEnv, makeRoomName } from '@/lib/livekit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (!isMeetingFeatureEnabled()) return NextResponse.json({ error: 'Meeting disabled' }, { status: 404 })
    const env = getLiveKitEnv()
    if (!env) return NextResponse.json({ error: 'LiveKit disabled' }, { status: 400 })
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => null)
    const eventId = String(body?.eventId || '')
    const deviceId = typeof body?.deviceId === 'string' ? body.deviceId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 16) : ''
    if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

    const ev = await getEventWithClub(eventId)
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Must be moderator or active member
    const role = (session.user.role || '').toUpperCase()
    const mod = role === 'ADMIN' || role === 'MODERATOR' || (await isModerator(session.user.id, eventId))
    const member = await isMember(session.user.id, eventId)
    if (!mod && !member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Meeting must be active and within open window
    const meeting = await prisma.meeting.findUnique({ where: { clubEventId: ev.id } })
    if (!meeting?.isActive) return NextResponse.json({ error: 'Meeting inactive' }, { status: 409 })
    if (!isWithinOpenWindow(ev.startsAt)) return NextResponse.json({ error: 'Meeting not open yet' }, { status: 425 })

    // Use presence to determine publish permission for non-moderators
    // Kameralar serbest: tüm katılımcılara yayın (publish) izni ver
    // Not: UI tarafında ilk girişte sadece moderatör için otomatik video/audio açıyoruz.
    const canPublish = true

    const identity = `${session.user.id}${deviceId ? ':' + deviceId : ''}`
    const token = await buildLiveKitToken({
      apiKey: env.apiKey,
      apiSecret: env.apiSecret,
      secretIsBase64: env.secretIsBase64,
      identity,
      name: session.user.name || session.user.username || undefined,
      roomName: makeRoomName(ev.id),
      canPublish,
      canSubscribe: true,
      ttlSec: env.tokenTtlSec,
    })

    return NextResponse.json({
      status: 'ok',
      token,
      wsUrl: env.url,
      canPublish,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
