// src/app/subscriptions/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LeftSidebar from '@/components/sidebars/LeftSidebar'
import ProfileBanner from '@/components/profile/ProfileBanner'
import SubscribedClubCard from '@/components/subscriptions/SubscribedClubCard'

export const dynamic = 'force-dynamic'

export default async function SubscriptionsPage() {
  const session = await auth()
  if (!session?.user?.id) return <div className="p-6">Lütfen giriş yapın.</div>
  const meId = session.user.id

  const [me, subs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: meId },
      select: { bannerUrl: true },
    }),
    prisma.subscription.findMany({
      where: { userId: meId, active: true },
      orderBy: { startedAt: 'desc' },
      include: {
        club: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            bannerUrl: true,
            priceTRY: true,
            capacity: true,
            moderator: { select: { id: true, name: true, username: true, avatarUrl: true } },
            _count: { select: { memberships: true, picks: true, events: true } },
          },
        },
      },
    }),
  ])

  return (
    <div className="space-y-6">
      {/* Mobil başlık (banner yok) */}
      <div className="md:hidden pt-2 text-center">
        <div className="text-3xl font-extrabold tracking-tight primaryRed">Kulüplerim</div>
      </div>

      {/* Desktop’ta banner kalsın */}
      <div className="hidden md:block">
        <ProfileBanner src={me?.bannerUrl ?? null} canEdit />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sol menü desktop’ta */}
        <div className="hidden md:block">
          <LeftSidebar />
        </div>

        {/* İçerik */}
        <div className="md:col-span-2 space-y-4">
          {subs.length === 0 ? (
            <div className="card p-6 text-sm text-gray-700">Henüz bir kulübe abone değilsiniz.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {subs.map((s) => (
                <SubscribedClubCard key={s.club.id} club={s.club as any} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
