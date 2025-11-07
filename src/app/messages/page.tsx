// src/app/messages/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileBanner from '@/components/profile/ProfileBanner'
import LeftSidebar from '@/components/sidebars/LeftSidebar'
import ThreadList from '@/components/messages/ThreadList'
import NewChatPicker from '@/components/messages/NewChatPicker'
import NotificationsPanel from '@/components/messages/NotificationsPanel'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const session = await auth()
  if (!session?.user?.id) return <div className="p-6">Lütfen giriş yapın.</div>
  const isAdmin = (session.user as any)?.role === 'ADMIN'
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { bannerUrl: true } })

  return (
    <div className="space-y-6 pt-4 lg:pt-0">
      <div className="lg:hidden pt-2 text-center">
        <div className="text-3xl font-extrabold tracking-tight primaryRed">Book Buddy</div>
        <div className="text-xl font-bold -mt-1">Sohbetler</div>
      </div>

      <div className="hidden lg:block">
        <ProfileBanner src={me?.bannerUrl ?? null} canEdit isAdmin={isAdmin} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 min-h-0">
        <div className="hidden lg:block">
          <LeftSidebar />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          <div className="col-span-1">
            <ThreadList />
          </div>
          <div className="hidden lg:block lg:col-span-2">
            <div className="card p-6 text-sm text-gray-600">Bir sohbet seçin.</div>
          </div>
        </div>
      </div>

      {/* Mobile'de bildirimler de bu sahnede yer alsın */}
      <div className="lg:hidden">
        <NotificationsPanel />
      </div>

      <NewChatPicker />
    </div>
  )
}
