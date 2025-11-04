// src/app/api/meet/mute/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getEventWithClub, isMeetingFeatureEnabled, isModerator } from '@/lib/meet'
import { getLiveKitEnv, makeRoomName } from '@/lib/livekit'
import { RoomServiceClient } from 'livekit-server-sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function restBase(url: string): string {
  try {
    const u = new URL(url)
    if (u.protocol === 'wss:') u.protocol = 'https:'
    if (u.protocol === 'ws:') u.protocol = 'http:'
    return u.origin
  } catch {
    return url.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:')
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isMeetingFeatureEnabled()) return NextResponse.json({ error: 'Meeting disabled' }, { status: 404 })
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => null)
    const eventId = String(body?.eventId || '')
    const targetUserId = String(body?.targetUserId || '')
    const mute = Boolean(body?.mute)
    if (!eventId || !targetUserId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const ev = await getEventWithClub(eventId)
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    const role = (session.user.role || '').toUpperCase()
    const mod = role === 'ADMIN' || role === 'MODERATOR' || (await isModerator(session.user.id, eventId))
    if (!mod) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const env = getLiveKitEnv()
    if (!env) return NextResponse.json({ error: 'LiveKit disabled' }, { status: 400 })
    const base = restBase(env.url)
    const client = new RoomServiceClient(base, env.apiKey, env.apiSecret)

    const roomName = makeRoomName(ev.id)
    const parts = await client.listParticipants(roomName)
    // identity format: userId or userId:deviceId → eşleşeni al
    const candidates = parts.filter((p) => (p.identity || '').startsWith(targetUserId))
    if (!candidates.length) return NextResponse.json({ error: 'Participant not found' }, { status: 404 })

    let affected = 0
    for (const p of candidates) {
      for (const t of p.tracks || []) {
        if (String(t.type).toUpperCase() === 'AUDIO' && t.sid) {
          if (mute) {
            await client.mutePublishedTrack(roomName, p.identity!, t.sid, true)
            affected++
          } else {
            // Remote unmute cannot force user mic on; this just clears server mute if set.
            await client.mutePublishedTrack(roomName, p.identity!, t.sid, false)
            affected++
          }
        }
      }
    }
    return NextResponse.json({ status: 'ok', affected })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
