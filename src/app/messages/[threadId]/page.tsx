// src/app/messages/[threadId]/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileBanner from '@/components/profile/ProfileBanner'
import LeftSidebar from '@/components/sidebars/LeftSidebar'
import ThreadList from '@/components/messages/ThreadList'
import ChatWindow from '@/components/messages/ChatWindow'

export const dynamic = 'force-dynamic'

export default async function ThreadPage({ params }: { params: { threadId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return <div className="p-6">Lütfen giriş yapın.</div>
  const meId = session.user.id

  const [me, thread] = await Promise.all([
    prisma.user.findUnique({ where: { id: meId }, select: { bannerUrl: true } }),
    prisma.dmThread.findFirst({
      where: { id: params.threadId, OR: [{ userAId: meId }, { userBId: meId }] },
      select: {
        id: true,
        userAId: true,
        userBId: true,
        userA: { select: { id: true } },
        userB: { select: { id: true } },
      },
    }),
  ])

  if (!thread) return <div className="p-6">Sohbet bulunamadı.</div>

  const activePeerId = thread.userAId === meId ? thread.userBId : thread.userAId

  return (
    <div className="space-y-6">
      <ProfileBanner src={me?.bannerUrl ?? null} canEdit />
      <div className="grid lg:grid-cols-3 gap-6">
        <div>
          <LeftSidebar />
        </div>
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <ThreadList activePeerId={activePeerId} />
          </div>
          <div className="col-span-2">
            <ChatWindow threadId={params.threadId} />
          </div>
        </div>
      </div>
    </div>
  )
}
