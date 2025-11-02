// src/app/notifications/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileBanner from '@/components/profile/ProfileBanner'
import LeftSidebar from '@/components/sidebars/LeftSidebar'
import NotificationsPanel from '@/components/messages/NotificationsPanel'

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user?.id) return <div className="p-6">Lütfen giriş yapın.</div>
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { bannerUrl: true } })

  return (
    <div className="space-y-6 pt-4 lg:pt-0">
      <div className="hidden lg:block">
        <ProfileBanner src={me?.bannerUrl ?? null} canEdit />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 min-h-0">
        <div className="hidden lg:block">
          <LeftSidebar />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 gap-4 min-h-0">
          <NotificationsPanel />
        </div>
      </div>
    </div>
  )
}

