// src/app/api/notifications/digest/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendNotificationEmail } from '@/lib/notify-email'

export async function POST() {
  const session = await auth()
  // Allow only admin to trigger
  if (!session?.user || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  // Find events that had messages since 'since'
  const recent = await prisma.chatMessage.findMany({
    where: { createdAt: { gte: since } },
    select: {
      authorId: true,
      room: { select: { event: { select: { id: true, club: { select: { name: true, slug: true } } } } } },
    },
  })
  const byEvent = new Map<string, { clubName: string; url: string; authors: Set<string> }>()
  for (const m of recent) {
    const ev = m.room?.event
    if (!ev) continue
    const key = ev.id
    const v = byEvent.get(key) || { clubName: ev.club?.name || 'Kulüp', url: `/clubs/${ev.club?.slug || ''}`, authors: new Set<string>() }
    if (m.authorId) v.authors.add(m.authorId)
    byEvent.set(key, v)
  }
  const eventIds = Array.from(byEvent.keys())
  if (eventIds.length === 0) return NextResponse.json({ ok: true, created: 0 })

  const members = await prisma.membership.findMany({
    where: { clubEventId: { in: eventIds }, isActive: true },
    select: { userId: true, clubEventId: true },
  })

  let created = 0
  for (const m of members) {
    const meta = byEvent.get(m.clubEventId)
    if (!meta) continue
    // Skip if the only messages are by the member himself
    if (meta.authors.size === 1 && meta.authors.has(m.userId)) continue
    const payload = { clubName: meta.clubName, url: meta.url, eventId: m.clubEventId }
    await prisma.notification.create({ data: { userId: m.userId, type: 'club_new_messages_daily', payload: JSON.stringify(payload) } })
    sendNotificationEmail(m.userId, 'club_new_messages_daily', payload).catch(() => {})
    created++
  }

  return NextResponse.json({ ok: true, created })
}

