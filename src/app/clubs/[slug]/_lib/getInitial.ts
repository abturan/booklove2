// src/app/clubs/[slug]/_lib/getInitial.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureConferenceFlagColumn } from '@/lib/conferenceFlag'

type EventMember = {
  id: string
  name: string
  username: string | null
  slug: string | null
  avatarUrl: string | null
}

type EventInitial = {
  id: string
  title: string
  startsAt: string
  notes: string | null
  priceTRY: number
  capacity: number | null
  memberCount: number
  members: EventMember[]
  memberSince: string | null
  isMember: boolean
  chatRoomId: string | null
  pick: {
    title: string
    author: string
    translator: string | null
    pages: number | null
    isbn: string | null
    coverUrl: string
    note: string | null
    monthKey: string | null
  } | null
  isSoldOut: boolean
  status: 'upcoming' | 'past'
}

export type ClubInitial = {
  me: {
    id: string | null
    name: string | null
    email: string | null
    avatarUrl: string | null
    city: string | null
    district: string | null
    phone: string | null
  }
  club: {
    id: string
    slug: string
    name: string
    description: string | null
    bannerUrl: string
    priceTRY: number
    moderatorId: string
    moderatorName: string
    moderatorAvatarUrl: string | null
    moderatorUsername: string | null
    moderatorSlug: string | null
    activeEventId: string | null
    events: EventInitial[]
    isModerator: boolean
    conferenceEnabled: boolean
  }
}

const fallbackBanner =
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1600&auto=format&fit=crop'
const fallbackCover =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop'

export async function getInitial(slug: string): Promise<ClubInitial | null> {
  const session = await auth()
  await ensureConferenceFlagColumn()

  const club = await prisma.club.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      bannerUrl: true,
      priceTRY: true,
      capacity: true,
      moderatorId: true,
      conferenceEnabled: true,
      moderator: { select: { name: true, avatarUrl: true, username: true, slug: true } },
      events: {
        // Son eklenen/son tarihli etkinlik en üstte görünsün
        orderBy: { startsAt: 'desc' },
        select: {
          id: true,
          startsAt: true,
          title: true,
          notes: true,
          priceTRY: true,
          capacity: true,
          bookTitle: true,
          bookAuthor: true,
          bookTranslator: true,
          bookPages: true,
          bookIsbn: true,
          bookCoverUrl: true,
        },
      },
    },
  })

  if (!club) return null

  const eventIds = club.events.map((e) => e.id)
  const now = new Date()

  const [memberCounts, memberPreviews, chatRooms, clubRoom, myMemberships, me] = await Promise.all([
    eventIds.length
      ? prisma.membership.groupBy({
          by: ['clubEventId'],
          where: { clubEventId: { in: eventIds }, isActive: true },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    Promise.all(
      club.events.map((event) =>
        prisma.membership.findMany({
          where: { clubEventId: event.id, isActive: true },
          orderBy: { joinedAt: 'desc' },
          take: 200,
          select: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                slug: true,
                avatarUrl: true,
              },
            },
          },
        }),
      ),
    ),
    eventIds.length
      ? prisma.chatRoom.findMany({
          where: { clubEventId: { in: eventIds } },
          select: { id: true, clubEventId: true },
        })
      : Promise.resolve([]),
    prisma.chatRoom.findUnique({
      where: { clubId: club.id },
      select: { id: true },
    }),
    session?.user?.id && eventIds.length
      ? prisma.membership.findMany({
          where: { userId: session.user.id, clubEventId: { in: eventIds }, isActive: true },
          select: { clubEventId: true, joinedAt: true },
        })
      : Promise.resolve([]),
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            city: true,
            district: true,
            phone: true,
          },
        })
      : Promise.resolve(null),
  ])

  const countMap = new Map<string, number>()
  memberCounts.forEach((row) => countMap.set(row.clubEventId, row._count._all))

  const memberMap = new Map<string, EventMember[]>()
  club.events.forEach((event, idx) => {
    const rows = memberPreviews[idx] || []
    memberMap.set(
      event.id,
      rows.map((r) => ({
        id: r.user.id,
        name: r.user.name ?? 'Üye',
        username: r.user.username ?? null,
        slug: r.user.slug ?? null,
        avatarUrl: r.user.avatarUrl ?? null,
      })),
    )
  })

  const chatMap = new Map<string, string>()
  chatRooms.forEach((room) => chatMap.set(room.clubEventId, room.id))

  const membershipMap = new Map<string, string>()
  myMemberships.forEach((m) => membershipMap.set(m.clubEventId, m.joinedAt.toISOString()))

  const safeBanner =
    typeof club.bannerUrl === 'string' && club.bannerUrl.trim().length > 0
      ? club.bannerUrl
      : fallbackBanner

  const isModerator = !!(session?.user?.id && club.moderatorId === session.user.id)

  let activeEventId: string | null = null
  const upcoming = club.events.find((e) => e.startsAt >= now)
  if (upcoming) activeEventId = upcoming.id
  else if (club.events.length > 0) activeEventId = club.events[club.events.length - 1]?.id ?? null

  const events: EventInitial[] = club.events.map((event) => {
    const memberCount = countMap.get(event.id) ?? 0
    const memberSince = membershipMap.get(event.id) ?? null
    const capacity =
      typeof event.capacity === 'number' && event.capacity >= 0
        ? event.capacity
        : typeof club.capacity === 'number' && club.capacity >= 0
          ? club.capacity
          : null
    const price = event.priceTRY ?? club.priceTRY
    const pick = event.bookTitle
      ? {
          title: event.bookTitle,
          author: event.bookAuthor ?? '—',
          translator: event.bookTranslator ?? null,
          pages: event.bookPages ?? null,
          isbn: event.bookIsbn ?? null,
          coverUrl: event.bookCoverUrl ?? fallbackCover,
          note: event.notes ?? null,
          monthKey: null,
        }
      : null
    const isSoldOut = typeof capacity === 'number' ? memberCount >= capacity : false
    const status = event.startsAt >= now ? 'upcoming' : 'past'

    return {
      id: event.id,
      title: event.title ?? 'Etkinlik',
      startsAt: event.startsAt.toISOString(),
      notes: event.notes ?? null,
      priceTRY: price,
      capacity,
      memberCount,
      members: memberMap.get(event.id) ?? [],
      memberSince,
      isMember: isModerator || membershipMap.has(event.id),
      chatRoomId: chatMap.get(event.id) ?? clubRoom?.id ?? null,
      pick,
      isSoldOut,
      status,
    }
  })

  return {
    me: {
      id: me?.id ?? null,
      name: me?.name ?? null,
      email: me?.email ?? null,
      avatarUrl: me?.avatarUrl ?? null,
      city: me?.city ?? null,
      district: me?.district ?? null,
      phone: me?.phone ?? null,
    },
    club: {
      id: club.id,
      slug: club.slug,
      name: club.name,
      description: club.description ?? null,
      bannerUrl: safeBanner,
      priceTRY: club.priceTRY,
      moderatorId: club.moderatorId,
      moderatorName: club.moderator?.name ?? '—',
      moderatorAvatarUrl: club.moderator?.avatarUrl ?? null,
      moderatorUsername: club.moderator?.username ?? null,
      moderatorSlug: club.moderator?.slug ?? null,
      activeEventId,
      events,
      isModerator,
      conferenceEnabled: !!club.conferenceEnabled,
    },
  }
}
