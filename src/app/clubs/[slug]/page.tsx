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

function monthKeyUTC(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
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
      moderator: { select: { name: true, avatarUrl: true, username: true, slug: true } },
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
      user: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
    },
  })

  const thisMonth = monthKeyUTC()

  const futureNearest = await prisma.clubPick.findFirst({
    where: { clubId: club.id, monthKey: { gte: thisMonth } },
    orderBy: { monthKey: 'asc' },
    select: {
      id: true,
      monthKey: true,
      note: true,
      book: {
        select: {
          title: true,
          author: true,
          translator: true,
          pages: true,
          coverUrl: true,
          isbn: true,
        },
      },
    },
  })

  const pastNearest = futureNearest
    ? null
    : await prisma.clubPick.findFirst({
        where: { clubId: club.id, monthKey: { lte: thisMonth } },
        orderBy: { monthKey: 'desc' },
        select: {
          id: true,
          monthKey: true,
          note: true,
          book: {
            select: {
              title: true,
              author: true,
              translator: true,
              pages: true,
              coverUrl: true,
              isbn: true,
            },
          },
        },
      })

  const anchorPick = futureNearest ?? pastNearest

  let prevPick: any = null
  let nextPick: any = null
  if (anchorPick?.monthKey) {
    prevPick = await prisma.clubPick.findFirst({
      where: { clubId: club.id, monthKey: { lt: anchorPick.monthKey } },
      orderBy: { monthKey: 'desc' },
      select: {
        monthKey: true,
        book: { select: { title: true, author: true, coverUrl: true } },
      },
    })
    nextPick = await prisma.clubPick.findFirst({
      where: { clubId: club.id, monthKey: { gt: anchorPick.monthKey } },
      orderBy: { monthKey: 'asc' },
      select: {
        monthKey: true,
        book: { select: { title: true, author: true, coverUrl: true } },
      },
    })
  }

  const now = new Date()

  let nextEvent: { id: string; title: string | null; startsAt: Date } | null = null

  if (anchorPick?.monthKey) {
    const { start, end } = monthRangeUTC(anchorPick.monthKey)
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

  const isSoldOut =
    typeof club.capacity === 'number' && club.capacity >= 0
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
      moderatorSlug: club.moderator?.slug ?? null,
      memberCount,
      isMember,
      memberSince: myMembership?.since ?? null,
      chatRoomId: room?.id ?? null,
      currentPick: anchorPick
        ? {
            title: anchorPick.book.title,
            author: anchorPick.book.author,
            translator: anchorPick.book.translator || null,
            pages: anchorPick.book.pages ?? null,
            isbn: anchorPick.book.isbn || null,
            coverUrl:
              anchorPick.book.coverUrl ??
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
            note: anchorPick.note || null,
            monthKey: anchorPick.monthKey,
          }
        : null,
      prevPick: prevPick
        ? {
            monthKey: prevPick.monthKey,
            title: prevPick.book.title,
            author: prevPick.book.author,
            coverUrl:
              prevPick.book.coverUrl ??
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
          }
        : null,
      nextPick: nextPick
        ? {
            monthKey: nextPick.monthKey,
            title: nextPick.book.title,
            author: nextPick.book.author,
            coverUrl:
              nextPick.book.coverUrl ??
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
        slug: m.user.slug ?? null,
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
