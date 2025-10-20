// src/app/subscriptions/page.tsx
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LeftSidebar from '@/components/sidebars/LeftSidebar'
import Image from 'next/image'
import ProfileBanner from '@/components/profile/ProfileBanner'

export const dynamic = 'force-dynamic'

export default async function SubscriptionsPage() {
  const session = await auth()
  if (!session?.user?.email) return <div className="p-6">Lütfen giriş yapın.</div>

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      bannerUrl: true,
      Subscriptions: {
        where: { active: true },
        select: { club: { select: { id: true, slug: true, name: true, bannerUrl: true } } },
      },
    },
  })

  if (!me) return <div className="p-6">Bulunamadı</div>

  const subs = me.Subscriptions

  return (
    <div className="space-y-6">
      <ProfileBanner src={me.bannerUrl} canEdit />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="hidden md:block">
          <LeftSidebar />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h1 className="text-2xl font-semibold mb-4">Aboneliklerim</h1>
            <div className="grid md:grid-cols-3 gap-4">
              {subs.map((s, i) => (
                <div key={s.club.id ?? i} className="card p-3">
                  <div className="relative h-24 rounded-xl overflow-hidden">
                    <Image
                      src={s.club.bannerUrl || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop'}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-3 font-medium">{s.club.name}</div>
                  <div className="mt-2 flex gap-2">
                    <Link href={`/clubs/${s.club.slug}`} scroll={false} className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm">
                      İncele
                    </Link>
                  </div>
                </div>
              ))}
              {!subs.length && <div className="text-sm text-gray-600">Aktif aboneliğiniz yok.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
