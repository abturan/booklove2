// src/app/clubs/[slug]/page.tsx
import Image from 'next/image'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ClubInteractive from '@/components/club/ClubInteractive'

export const dynamic = 'force-dynamic'

function monthRangeUTC(monthKey: string) {
  const [y, m] = monthKey.split('-').map((n) => parseInt(n, 10))
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0))
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0))
  return { start, end }
}

export default async function ClubPage({ params }: { params: { slug: string } }) {
  const session = await auth()

  const club = await prisma.club.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      bannerUrl: true,
      priceTRY: true,
      moderatorId: true,
      capacity: true,
      moderator: { select: { name: true, avatarUrl: true, username: true } },
    },
  })
  if (!club) {
    return <div className="container mx-auto px-4 py-10">Kulüp bulunamadı.</div>
  }

  const memberCount = await prisma.membership.count({
    where: { clubId: club.id, isActive: true },
  })

  const members = await prisma.membership.findMany({
    where: { clubId: club.id, isActive: true },
    orderBy: { joinedAt: 'desc' },
    take: 30,
    select: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  })

  const currentPick = await prisma.clubPick.findFirst({
    where: { clubId: club.id, isCurrent: true },
    select: {
      id: true,
      monthKey: true,
      isCurrent: true,
      book: { select: { title: true, author: true, coverUrl: true } },
    },
  })

  const now = new Date()

  let nextEvent: { id: string; title: string | null; startsAt: Date } | null = null

  if (currentPick?.monthKey) {
    const { start, end } = monthRangeUTC(currentPick.monthKey)
    const eventInPickMonth = await prisma.clubEvent.findFirst({
      where: { clubId: club.id, startsAt: { gte: start, lt: end } },
      orderBy: { startsAt: 'asc' },
      select: { id: true, title: true, startsAt: true },
    })
    if (eventInPickMonth && eventInPickMonth.startsAt >= now) {
      nextEvent = eventInPickMonth
    }
  }

  if (!nextEvent) {
    nextEvent = await prisma.clubEvent.findFirst({
      where: { clubId: club.id, startsAt: { gte: now } },
      orderBy: { startsAt: 'asc' },
      select: { id: true, title: true, startsAt: true },
    })
  }

  const room = await prisma.chatRoom.findFirst({
    where: { clubId: club.id },
    select: { id: true },
  })

  const me =
    session?.user?.id
      ? await prisma.user.findUnique({
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
      : null

  let myMembership: { since: string } | null = null
  if (session?.user?.id) {
    const m = await prisma.membership.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId: club.id } },
      select: { isActive: true, joinedAt: true },
    })
    if (m?.isActive) myMembership = { since: m.joinedAt.toISOString() }
  }

  const isModerator = !!(session?.user?.id && club.moderatorId === session.user.id)
  const isMember = !!myMembership || isModerator

  const fallbackBanner =
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1600&auto=format&fit=crop'
  const safeBannerUrl =
    typeof club.bannerUrl === 'string' && club.bannerUrl.trim().length > 0
      ? club.bannerUrl
      : fallbackBanner

  const isSoldOut = typeof club.capacity === 'number' && club.capacity >= 0
    ? memberCount >= (club.capacity ?? 0)
    : false

  const initial = {
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
      description: club.description,
      bannerUrl: safeBannerUrl,
      priceTRY: club.priceTRY,
      moderatorName: club.moderator?.name ?? '—',
      moderatorAvatarUrl: club.moderator?.avatarUrl ?? null,
      moderatorUsername: club.moderator?.username ?? null,
      memberCount,
      isMember,
      memberSince: myMembership?.since ?? null,
      chatRoomId: room?.id ?? null,
      currentPick: currentPick
        ? {
            title: currentPick.book.title,
            author: currentPick.book.author,
            coverUrl:
              currentPick.book.coverUrl ??
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
          }
        : null,
      nextEvent: nextEvent
        ? { title: nextEvent.title ?? 'Aylık Oturum', startsAt: nextEvent.startsAt.toISOString() }
        : null,
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name ?? 'Üye',
        username: m.user.username ?? null,
        avatarUrl: m.user.avatarUrl ?? null,
      })),
      capacity: club.capacity ?? null,
      isSoldOut,
    },
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden">
        <Image src={initial.club.bannerUrl} alt="" fill className="object-cover" priority />
      </div>
      <ClubInteractive initial={initial as any} />
    </div>
  )
}
