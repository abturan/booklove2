// src/app/messages/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileBanner from '@/components/profile/ProfileBanner'
import LeftSidebar from '@/components/sidebars/LeftSidebar'
import ThreadList from '@/components/messages/ThreadList'

export default async function MessagesPage() {
  const session = await auth()
  if (!session?.user?.id) return <div className="p-6">Lütfen giriş yapın.</div>
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { bannerUrl: true } })

  return (
    <div className="space-y-6">
      <ProfileBanner src={me?.bannerUrl ?? null} canEdit />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="hidden lg:block">
          <LeftSidebar />
        </div>
        <div className="lg:col-span-2">
          <div className="block lg:hidden">
            <ThreadList />
          </div>
          <div className="hidden lg:grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <ThreadList />
            </div>
            <div className="col-span-2">
              <div className="card p-6 text-sm text-gray-600">Bir sohbet seçin.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
