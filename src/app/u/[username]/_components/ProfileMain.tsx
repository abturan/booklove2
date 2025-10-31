// src/app/u/[username]/_components/ProfileMain.tsx
import InfiniteFeed from '@/components/feed/InfiniteFeed'
import { slugify } from '@/lib/slugify'
import type { UserLite } from '../_lib/findUser'
import ProfileTabs from './ProfileTabs'
import { prisma } from '@/lib/prisma'
import JoinedClubsGrid from '@/components/profile/JoinedClubsGrid'

export default async function ProfileMain({
  user,
  active,
}: {
  user: UserLite
  active: 'clubs' | 'posts'
}) {
  const rawMemberships = await prisma.membership.findMany({
    where: { userId: user.id, isActive: true },
    select: {
      joinedAt: true,
      clubId: true,
      club: {
        select: {
          id: true,
          slug: true,
          name: true,
          bannerUrl: true,
          _count: { select: { memberships: true, events: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  const memberships = [] as typeof rawMemberships
  const seen = new Set<string>()
  for (const m of rawMemberships) {
    if (seen.has(m.clubId)) continue
    seen.add(m.clubId)
    memberships.push(m)
  }

  const joinedItems = memberships.map((m) => ({
    id: m.club.id,
    slug: m.club.slug,
    name: m.club.name,
    imageUrl: m.club.bannerUrl || null,
    members: m.club._count.memberships,
    picks: m.club._count.events,
    events: m.club._count.events,
  }))

  const clubsNode = <JoinedClubsGrid items={joinedItems} />

  const postsNode = (
    <div className="space-y-6">
      <InfiniteFeed scope={`user:${user.username || user.slug || slugify((user.name || '').trim())}`} />
    </div>
  )

  return (
    <div className="lg:col-span-2 space-y-4">
      <ProfileTabs initialActive={active} clubsNode={clubsNode} postsNode={postsNode} />
    </div>
  )
}
