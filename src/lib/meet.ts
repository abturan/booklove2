// src/lib/meet.ts
import { prisma } from '@/lib/prisma'

export async function getEventWithClub(eventId: string) {
  return prisma.clubEvent.findUnique({
    where: { id: String(eventId) },
    select: { id: true, startsAt: true, clubId: true, title: true, club: { select: { id: true, name: true, moderatorId: true } } },
  })
}

export async function isModerator(userId: string, eventId: string): Promise<boolean> {
  const ev = await getEventWithClub(eventId)
  if (!ev) return false
  return ev.club.moderatorId === userId
}

export async function isMember(userId: string, eventId: string): Promise<boolean> {
  const m = await prisma.membership.findUnique({ where: { userId_clubEventId: { userId, clubEventId: String(eventId) } }, select: { isActive: true } })
  return !!m?.isActive
}

export async function ensureMeeting(eventId: string) {
  const ev = await getEventWithClub(eventId)
  if (!ev) return null
  const opensAt = new Date(ev.startsAt.getTime() - 10 * 60 * 1000)
  const existing = await prisma.meeting.findUnique({ where: { clubEventId: ev.id }, select: { id: true } })
  if (existing) return existing
  return prisma.meeting.create({ data: { clubEventId: ev.id, isActive: false, opensAt } })
}

export function isWithinOpenWindow(startsAt: Date): boolean {
  // Allow bypass via env for testing
  const ignore = String(process.env.MEETING_IGNORE_OPEN_WINDOW || '').toLowerCase()
  if (ignore === '1' || ignore === 'true' || ignore === 'yes' || ignore === 'on') return true
  const minutes = Number(process.env.MEETING_OPEN_WINDOW_MINUTES || '10')
  const windowMs = Number.isFinite(minutes) ? Math.max(0, minutes) * 60 * 1000 : 10 * 60 * 1000
  const now = Date.now()
  return now >= startsAt.getTime() - windowMs
}

export function isMeetingFeatureEnabled(): boolean {
  const flag = String(process.env.LIVEKIT_ENABLED || '0').toLowerCase()
  return flag === '1' || flag === 'true' || flag === 'yes' || flag === 'on'
}
