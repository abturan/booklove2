// src/components/sidebars/PublicProfileSidebar.tsx
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import HeaderSection from '@/components/sidebars/profile/HeaderSection'
import FriendAction from '@/components/sidebars/profile/FriendAction'
import ModeratorClubCard from '@/components/sidebars/profile/ModeratorClubCard'
import MemberClubList from '@/components/sidebars/profile/MemberClubList'
import FriendCloud from '@/components/sidebars/profile/FriendCloud'

export default async function PublicProfileSidebar({ userId }: { userId: string }) {
  const session = await auth()
  const meId = session?.user?.id || null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bio: true,
      Club: {
        select: {
          slug: true,
          name: true,
          bannerUrl: true,
          _count: { select: { memberships: true, picks: true, events: true } },
        },
      },
      Memberships: {
        include: {
          club: {
            select: {
              slug: true,
              name: true,
              bannerUrl: true,
              _count: { select: { memberships: true, picks: true, events: true } },
              moderatorId: true,
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
        take: 50,
      },
    },
  })
  if (!user) return null

  // arkadaşlık durumu
  let mode: 'none' | 'message' | 'sent' | 'pending' | 'canSend' = 'none'
  if (meId && meId !== user.id) {
    const pairs = await prisma.friendRequest.findMany({
      where: { OR: [{ fromId: meId, toId: user.id }, { fromId: user.id, toId: meId }] },
      select: { fromId: true, toId: true, status: true, respondedAt: true },
      orderBy: { createdAt: 'desc' },
    })
    if (pairs.some((p) => p.status === 'ACCEPTED')) mode = 'message'
    else {
      const mine = pairs.find((p) => p.fromId === meId && p.toId === user.id)
      const theirs = pairs.find((p) => p.fromId === user.id && p.toId === meId)
      mode =
        mine?.status === 'PENDING'
          ? 'sent'
          : theirs?.status === 'PENDING' && !theirs.respondedAt
          ? 'pending'
          : 'canSend'
    }
  }

  // Arkadaş bulutu için veriler
  const friends = await prisma.friendRequest.findMany({
    where: { status: 'ACCEPTED', OR: [{ fromId: user.id }, { toId: user.id }] },
    orderBy: { respondedAt: 'desc' },
    take: 48,
    select: { fromId: true, toId: true },
  })
  const friendIds = Array.from(new Set(friends.map((f) => (f.fromId === user.id ? f.toId : f.fromId))))
  const friendUsers = friendIds.length
    ? await prisma.user.findMany({
        where: { id: { in: friendIds } },
        select: { id: true, username: true, slug: true, avatarUrl: true, name: true },
        take: 48,
      })
    : []

  // Üye olduğu kulüpler (moderatör olduğu kulüp hariç)
  const memberClubs =
    user.Memberships?.map((m) => m.club)
      .filter((c) => !!c && c.moderatorId !== user.id)
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        bannerUrl: c.bannerUrl,
        counts: {
          memberships: c._count?.memberships ?? 0,
          picks: c._count?.picks ?? 0,
          events: c._count?.events ?? 0,
        },
      })) ?? []

  return (
    <div className="space-y-5">
      <HeaderSection avatarUrl={user.avatarUrl} name={user.name} username={user.username}>
        <FriendAction mode={mode} userId={user.id} />
      </HeaderSection>

      {user.Club && (
        <ModeratorClubCard
          name={user.Club.name}
          slug={user.Club.slug}
          bannerUrl={user.Club.bannerUrl}
          ownerName={user.name || ''}
          ownerUsername={user.username || ''}
          counts={{
            memberships: user.Club._count?.memberships ?? 0,
            picks: user.Club._count?.picks ?? 0,
            events: user.Club._count?.events ?? 0,
          }}
        />
      )}

      <FriendCloud users={friendUsers} />
      <MemberClubList items={memberClubs} />
    </div>
  )
}
