// src/app/api/admin/events/[id]/participants/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureCapacityForManualAdd, ensureMembershipActive, deactivateMembershipRecords, notifyMembershipJoined } from '@/lib/membershipLifecycle'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await prisma.clubEvent.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        startsAt: true,
        club: { select: { id: true, name: true, slug: true, moderator: { select: { id: true, name: true, email: true } } } },
        memberships: {
          where: { isActive: true },
          select: {
            id: true,
            joinedAt: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                avatarUrl: true,
                slug: true,
              },
            },
          },
        },
        subscriptions: {
          where: { active: true },
          select: {
            id: true,
            startedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                avatarUrl: true,
                slug: true,
              },
            },
          },
        },
        paymentIntents: {
          where: { status: 'SUCCEEDED' },
          select: {
            id: true,
            userId: true,
            amountTRY: true,
            createdAt: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const participantMap = new Map<string, any>()
    const paymentMap = new Map<string, { amount: number; createdAt: Date }>()

    event.paymentIntents.forEach((intent) => {
      if (!intent.userId) return
      const amount = (intent.amountTRY ?? 0) / 100
      const createdAt = intent.createdAt ?? new Date(0)
      const existing = paymentMap.get(intent.userId)
      if (!existing || createdAt > existing.createdAt) {
        paymentMap.set(intent.userId, { amount, createdAt })
      }
    })

    event.memberships.forEach((membership) => {
      const user = membership.user
      if (!user) return
      participantMap.set(user.id, {
        userId: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        slug: user.slug,
        sources: [{ type: 'membership', id: membership.id, joinedAt: membership.joinedAt, role: membership.role }],
      })
    })

    event.subscriptions.forEach((subscription) => {
      const user = subscription.user
      if (!user) return
      const existing = participantMap.get(user.id)
      if (existing) {
        existing.sources.push({ type: 'subscription', id: subscription.id, startedAt: subscription.startedAt })
      } else {
        participantMap.set(user.id, {
          userId: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          slug: user.slug,
          sources: [{ type: 'subscription', id: subscription.id, startedAt: subscription.startedAt }],
        })
      }
    })

    if (event.club.moderator) {
      const mod = event.club.moderator
      participantMap.set(mod.id, {
        userId: mod.id,
        name: mod.name,
        username: null,
        email: mod.email,
        avatarUrl: null,
        slug: null,
        sources: [{ type: 'moderator', id: `moderator:${mod.id}`, joinedAt: new Date(), role: 'MODERATOR' }],
      })
    }

    const membershipCount = event.memberships.length
    const subscriptionCount = event.subscriptions.length

    const participants = Array.from(participantMap.values())
      .map((participant) => {
        const registeredAt = earliestDate(participant.sources)
        const payment = paymentMap.get(participant.userId)
        return {
          ...participant,
          registeredAt: registeredAt ? registeredAt.toISOString() : null,
          paymentAmount: payment?.amount ?? null,
        }
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'))

    const mailHistory = await prisma.eventMail.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        subject: true,
        note: true,
        previewText: true,
        sendScope: true,
        createdAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
        recipients: {
          select: {
            id: true,
            userId: true,
            email: true,
            name: true,
            status: true,
            sentAt: true,
            error: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        startsAt: event.startsAt,
        club: (({ id, name, slug }) => ({ id, name, slug }))(event.club),
        moderator: event.club.moderator
          ? { id: event.club.moderator.id, name: event.club.moderator.name, email: event.club.moderator.email }
          : null,
        stats: {
          total: participants.length,
          membershipCount,
          subscriptionCount,
        },
      },
      participants,
      mailHistory,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const userId = String(body?.userId || '').trim()
    if (!userId) return NextResponse.json({ error: 'Kullanıcı ID gerekli' }, { status: 400 })

    const [user, event] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      prisma.clubEvent.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          clubId: true,
          capacity: true,
          club: { select: { id: true, capacity: true } },
        },
      }),
    ])
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    if (!event) return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 })

    const { activated } = await prisma.$transaction(async (tx) => {
      await ensureCapacityForManualAdd(tx, {
        clubId: event.clubId,
        clubEventId: event.id,
        eventCapacity: event.capacity ?? null,
        clubCapacity: event.club?.capacity ?? null,
      })
      return ensureMembershipActive(tx, {
        userId,
        clubId: event.clubId,
        clubEventId: event.id,
      })
    })

    if (activated) {
      await notifyMembershipJoined({ userId, clubEventId: event.id })
    }

    return NextResponse.json({ ok: true, activated })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Sunucu hatası' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const userId = String(body?.userId || '').trim()
    if (!userId) return NextResponse.json({ error: 'Kullanıcı ID gerekli' }, { status: 400 })

    const event = await prisma.clubEvent.findUnique({
      where: { id: params.id },
      select: { id: true, club: { select: { moderatorId: true } } },
    })
    if (!event) return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 })
    if (event.club?.moderatorId && event.club.moderatorId === userId) {
      return NextResponse.json({ error: 'Moderatör kaldırılamaz' }, { status: 400 })
    }

    await prisma.$transaction((tx) => deactivateMembershipRecords(tx, { userId, clubEventId: event.id }))

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Sunucu hatası' }, { status: 500 })
  }
}

function earliestDate(
  sources: Array<{ joinedAt?: Date | string | null; startedAt?: Date | string | null }>
): Date | null {
  let earliest: Date | null = null
  for (const source of sources) {
    const value = source.joinedAt ?? source.startedAt
    if (!value) continue
    const date = value instanceof Date ? value : new Date(value)
    if (!earliest || date < earliest) {
      earliest = date
    }
  }
  return earliest
}
