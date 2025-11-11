// src/lib/membershipLifecycle.ts
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notify'
import { sendNotificationEmail } from '@/lib/notify-email'

type WritableClient = Prisma.TransactionClient | typeof prisma

export async function ensureCapacityForManualAdd(
  client: WritableClient,
  opts: {
    clubId: string
    clubEventId: string
    eventCapacity?: number | null
    clubCapacity?: number | null
  }
) {
  let eventCap = typeof opts.eventCapacity === 'number' ? opts.eventCapacity : null
  let clubCap = typeof opts.clubCapacity === 'number' ? opts.clubCapacity : null
  let hasEventCap = eventCap !== null && eventCap >= 0
  let hasClubCap = clubCap !== null && clubCap >= 0

  if (!hasEventCap && !hasClubCap) {
    const event = await client.clubEvent.findUnique({
      where: { id: opts.clubEventId },
      select: { capacity: true, club: { select: { capacity: true } } },
    })
    if (event) {
      eventCap = typeof event.capacity === 'number' ? event.capacity : null
      hasEventCap = eventCap !== null && eventCap >= 0
      clubCap = typeof event.club?.capacity === 'number' ? event.club.capacity : null
      hasClubCap = clubCap !== null && clubCap >= 0
    }
  }

  const effectiveCapacity = hasEventCap ? eventCap : hasClubCap ? clubCap : null
  if (effectiveCapacity === null) return

  const activeCount = await client.membership.count({
    where: { clubEventId: opts.clubEventId, isActive: true },
  })
  if (activeCount < effectiveCapacity) return

  const needed = activeCount + 1
  if (hasEventCap) {
    await client.clubEvent.update({
      where: { id: opts.clubEventId },
      data: { capacity: needed },
    })
    return
  }
  if (hasClubCap) {
    await client.club.update({
      where: { id: opts.clubId },
      data: { capacity: needed },
    })
  }
}

export async function ensureMembershipActive(
  client: WritableClient,
  opts: { userId: string; clubId: string; clubEventId: string }
) {
  const existing = await client.membership.findUnique({
    where: { userId_clubEventId: { userId: opts.userId, clubEventId: opts.clubEventId } },
    select: { id: true, isActive: true },
  })
  const activated = !existing || !existing.isActive

  await client.membership.upsert({
    where: { userId_clubEventId: { userId: opts.userId, clubEventId: opts.clubEventId } },
    update: { isActive: true, clubId: opts.clubId, role: 'MEMBER' },
    create: { userId: opts.userId, clubId: opts.clubId, clubEventId: opts.clubEventId, isActive: true, role: 'MEMBER' },
  })

  await client.subscription.upsert({
    where: { userId_clubEventId: { userId: opts.userId, clubEventId: opts.clubEventId } },
    update: { active: true, startedAt: new Date(), canceledAt: null, clubId: opts.clubId },
    create: { userId: opts.userId, clubId: opts.clubId, clubEventId: opts.clubEventId, active: true, startedAt: new Date() },
  })

  return { activated }
}

export async function deactivateMembershipRecords(
  client: WritableClient,
  opts: { userId: string; clubEventId: string }
) {
  const membershipResult = await client.membership.updateMany({
    where: { userId: opts.userId, clubEventId: opts.clubEventId, isActive: true },
    data: { isActive: false },
  })
  const subscriptionResult = await client.subscription.updateMany({
    where: { userId: opts.userId, clubEventId: opts.clubEventId, active: true },
    data: { active: false, canceledAt: new Date() },
  })
  return { membershipDeactivated: membershipResult.count > 0, subscriptionDeactivated: subscriptionResult.count > 0 }
}

export async function notifyMembershipJoined(opts: { userId: string; clubEventId: string }) {
  const event = await prisma.clubEvent.findUnique({
    where: { id: opts.clubEventId },
    select: {
      id: true,
      title: true,
      startsAt: true,
      clubId: true,
      club: { select: { name: true, slug: true } },
    },
  })
  if (!event) return
  const payload = {
    clubId: event.clubId,
    eventId: event.id,
    eventTitle: event.title,
    startsAt: event.startsAt.toISOString(),
    clubName: event.club?.name || 'Kulüp',
    clubSlug: event.club?.slug || null,
    url: event.club?.slug ? `/clubs/${event.club.slug}` : undefined,
  }
  await createNotification({ userId: opts.userId, type: 'club_membership_joined', payload })
  sendNotificationEmail(opts.userId, 'club_membership_joined', payload).catch(() => {})
}
