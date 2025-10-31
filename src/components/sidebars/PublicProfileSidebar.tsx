// src/components/sidebars/PublicProfileSidebar.tsx
import { prisma } from '@/lib/prisma'
import ModeratorClubCard from '@/components/sidebars/profile/ModeratorClubCard'
import FriendCloud from '@/components/sidebars/profile/FriendCloud'
import MemberClubsList from '@/components/sidebars/profile/MemberClubsList'

export default async function PublicProfileSidebar({ userId }: { userId: string }) {
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
          _count: { select: { memberships: true, events: true } },
        },
      },
      Memberships: {
        include: {
          club: {
            select: {
              slug: true,
              name: true,
              bannerUrl: true,
              _count: { select: { memberships: true, events: true } },
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })
  if (!user) return null

  const accepted = await prisma.friendRequest.findMany({
    where: { status: 'ACCEPTED', OR: [{ fromId: user.id }, { toId: user.id }] },
    orderBy: { createdAt: 'desc' },
    take: 24,
    select: { fromId: true, toId: true },
  })
  const peerIds = Array.from(new Set(accepted.map((r) => (r.fromId === user.id ? r.toId : r.fromId))))
  const friends = peerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: peerIds.slice(0, 12) } },
        select: { id: true, name: true, username: true, slug: true, avatarUrl: true },
      })
    : []

  const friendCount = await prisma.friendRequest.count({
    where: { status: 'ACCEPTED', OR: [{ fromId: user.id }, { toId: user.id }] },
  })

  const memberships = (user.Memberships || []).map((m) => m.club)

  return (
    <div className="space-y-5">
      {user.Club && (
        <ModeratorClubCard
          name={user.Club.name}
          slug={user.Club.slug}
          bannerUrl={user.Club.bannerUrl}
          ownerName={user.name || ''}
          ownerUsername={user.username || ''}
          counts={{
            memberships: user.Club._count?.memberships ?? 0,
            picks: user.Club._count?.events ?? 0,
            events: user.Club._count?.events ?? 0,
          }}
        />
      )}
      <FriendCloud title="Arkadaşlar" count={friendCount} friends={friends} />
      <MemberClubsList items={memberships} />
    </div>
  )
}
