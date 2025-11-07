// src/app/messages/start/[peerId]/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileBanner from '@/components/profile/ProfileBanner'
import LeftSidebar from '@/components/sidebars/LeftSidebar'
import ThreadList from '@/components/messages/ThreadList'

export const dynamic = 'force-dynamic'

type Props = { params: { peerId: string } }

export default async function StartPeerChatPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) return <div className="p-6">Lütfen giriş yapın.</div>
  const isAdmin = (session.user as any)?.role === 'ADMIN'
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { bannerUrl: true } })

  return (
    <div className="space-y-6">
      <ProfileBanner src={me?.bannerUrl ?? null} canEdit isAdmin={isAdmin} />
      <div className="grid lg:grid-cols-3 gap-6">
        <div>
          <LeftSidebar />
        </div>
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <ThreadList activePeerId={params.peerId} />
          </div>
          <div className="col-span-2">
            <div className="card p-6 min-h-[60vh] flex items-center justify-center text-center">
              <div>
                <div className="text-lg font-semibold mb-2">Sohbet Seçin veya Başlatın</div>
                <p className="text-sm text-gray-600">
                  Soldan bir konuşma seçin. Eğer {params.peerId} kullanıcısıyla ilk kez yazışacaksanız,
                  mevcut konuşma listesinde görünmüyor olabilir; önce yeni bir konuşma oluşturmanız gerekebilir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
