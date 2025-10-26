// src/app/messages/[threadId]/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileBanner from '@/components/profile/ProfileBanner'
import LeftSidebar from '@/components/sidebars/LeftSidebar'
import ThreadList from '@/components/messages/ThreadList'
import ChatWindow from '@/components/messages/ChatWindow'

type Props = { params: { threadId: string } }

export default async function ThreadMessagesPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) return <div className="p-6">Lütfen giriş yapın.</div>
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { bannerUrl: true } })

  return (
    <div className="space-y-6">
      <div className="hidden lg:block">
        <ProfileBanner src={me?.bannerUrl ?? null} canEdit />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="hidden lg:block">
          <LeftSidebar />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-1 lg:col-span-2">
            <ChatWindow threadId={params.threadId} />
          </div>
          <div className="hidden lg:block lg:col-span-1">
            <ThreadList activeThreadId={params.threadId} />
          </div>
        </div>
      </div>
    </div>
  )
}
