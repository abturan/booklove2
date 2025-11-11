// src/components/sidebars/PublicProfileSidebar.tsx
import { prisma } from '@/lib/prisma'
import ModeratorClubCard from '@/components/sidebars/profile/ModeratorClubCard'
import FriendCloud from '@/components/sidebars/profile/FriendCloud'
import MemberClubsList from '@/components/sidebars/profile/MemberClubsList'
import { getFollowCounts, listFollowData } from '@/lib/follow'

export default async function PublicProfileSidebar({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bio: true,
      clubsModerated: {
        select: {
          id: true,
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

  const { followers, following, mutual } = await listFollowData(user.id)
  const followCounts = await getFollowCounts(user.id)

  const memberships = (user.Memberships || []).map((m) => m.club)
  const moderatedClubs = user.clubsModerated || []

  return (
    <div className="space-y-5">
      {moderatedClubs.map((club) => (
        <ModeratorClubCard
          key={club.id}
          name={club.name}
          slug={club.slug}
          ownerName={user.name || ''}
          ownerUsername={user.username || ''}
          counts={{ participants: club._count?.memberships ?? 0 }}
        />
      ))}
      <FriendCloud
        title="Book Buddy"
        count={followCounts.followers}
        friends={followers.slice(0, 12)}
        followers={followers.slice(0, 12)}
        mutual={mutual.slice(0, 12)}
        userId={user.id}
      />
      <MemberClubsList items={memberships} />
    </div>
  )
}
