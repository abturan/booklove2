// src/app/api/meet/notify-absent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEventWithClub, isMeetingFeatureEnabled, isModerator } from '@/lib/meet'
import { sendMail } from '@/lib/mail'

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

    const pres = await prisma.meetingPresence.findMany({ where: { clubEventId: ev.id }, select: { userId: true, lastSeenAt: true, leftAt: true } })
    const members = await prisma.membership.findMany({ where: { clubEventId: ev.id, isActive: true }, select: { userId: true, user: { select: { email: true, name: true } } } })
    const now = Date.now()
    const onlineWindow = 2 * 60 * 1000
    const presentIds = new Set(pres.filter((p) => !p.leftAt && now - p.lastSeenAt.getTime() <= onlineWindow).map((p) => p.userId))
    const absent = members.filter((m) => !!m.user?.email && !presentIds.has(m.userId))

    const subject = `${ev.club.name} · "${ev.title}" oturumuna katılım hatırlatması`
    const base = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || '').replace(/\/$/, '')
    const joinUrl = `${base}/clubs/${encodeURIComponent(ev.club.name)}`
    const html = (name?: string | null) => `Merhaba ${name || ''},<br/><br/> ${ev.club.name} kulübünün "${ev.title}" oturumu başladı. Katılmak için giriş yapıp etkinlik sayfasından "Katıl" butonuna tıklayabilirsiniz.<br/><br/><a href="${joinUrl}" target="_blank">Etkinlik sayfasına git</a>`

    for (const m of absent) {
      try { await sendMail(String(m.user?.email), subject, html(m.user?.name)) } catch {}
    }
    return NextResponse.json({ status: 'ok', notified: absent.length })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
