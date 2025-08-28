import Image from 'next/image'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ClubInteractive from '@/components/club/ClubInteractive'

export const dynamic = 'force-dynamic'

export default async function ClubPage({ params }: { params: { slug: string } }) {
  const session = await auth()

  // 1) Kulübün temel bilgileri
  const club = await prisma.club.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      bannerUrl: true,
      priceTRY: true,
      moderator: { select: { name: true } }
    }
  })
  if (!club) {
    return <div className="container mx-auto px-4 py-10">Kulüp bulunamadı.</div>
  }

  // 2) Üye sayısı
  const memberCount = await prisma.membership.count({
    where: { clubId: club.id, isActive: true }
  })

  // 3) Üyeler (maks 30 avatar) — joinedAt ile sırala
  const members = await prisma.membership.findMany({
    where: { clubId: club.id, isActive: true },
    orderBy: { joinedAt: 'desc' },
    take: 30,
    select: {
      user: { select: { id: true, name: true, avatarUrl: true } }
    }
  })

  // 4) Bu ayın seçkisi
  const currentPick = await prisma.clubPick.findFirst({
    where: { clubId: club.id, isCurrent: true },
    include: { book: { select: { title: true, author: true, coverUrl: true } } }
  })

  // 5) Yaklaşan etkinlik
  const nextEvent = await prisma.clubEvent.findFirst({
    where: { clubId: club.id },
    orderBy: { startsAt: 'asc' },
    select: { id: true, title: true, startsAt: true }
  })

  // 6) Sohbet odası
  const room = await prisma.chatRoom.findFirst({
    where: { clubId: club.id },
    select: { id: true }
  })

  // 7) Benim üyeliğim
  let myMembership: { since: string } | null = null
  if (session?.user?.id) {
    const m = await prisma.membership.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId: club.id } },
      select: { isActive: true, joinedAt: true }
    })
    if (m?.isActive) myMembership = { since: m.joinedAt.toISOString() }
  }

  const initial = {
    me: {
      id: session?.user?.id ?? null,
      name: session?.user?.name ?? null,
      avatarUrl: (session?.user as any)?.avatarUrl ?? null
    },
    club: {
      id: club.id,
      slug: club.slug,
      name: club.name,
      description: club.description,
      bannerUrl:
        club.bannerUrl ??
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1600&auto=format&fit=crop',
      priceTRY: club.priceTRY,
      moderatorName: club.moderator?.name ?? '—',
      memberCount,
      isMember: !!myMembership,
      memberSince: myMembership?.since ?? null,
      chatRoomId: room?.id ?? null,
      currentPick: currentPick
        ? {
            title: currentPick.book.title,
            author: currentPick.book.author,
            coverUrl:
              currentPick.book.coverUrl ??
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop'
          }
        : null,
      nextEvent: nextEvent
        ? { title: nextEvent.title, startsAt: nextEvent.startsAt.toISOString() }
        : null,
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name ?? 'Üye',
        avatarUrl:
          m.user.avatarUrl ||
          `https://api.dicebear.com/8.x/thumbs/png?seed=${encodeURIComponent(m.user.id)}`
      }))
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden">
        <Image src={initial.club.bannerUrl} alt="" fill className="object-cover" priority />
      </div>
      <ClubInteractive initial={initial} />
    </div>
  )
}
