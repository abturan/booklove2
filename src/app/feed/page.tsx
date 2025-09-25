// src/app/feed/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LeftSidebar from '@/components/sidebars/LeftSidebar'
import ProfileBanner from '@/components/profile/ProfileBanner'
import PostAndFeed from '@/components/feed/PostAndFeed'

export default async function FeedPage() {
  const session = await auth()
  const me = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { bannerUrl: true } })
    : null

  return (
    <div className="space-y-6">
      <ProfileBanner src={me?.bannerUrl ?? null} canEdit={!!session?.user?.id} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div>
          <LeftSidebar />
        </div>

        <div className="lg:col-span-2">
          <PostAndFeed />
        </div>
      </div>
    </div>
  )
}







