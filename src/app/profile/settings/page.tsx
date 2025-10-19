// src/app/profile/settings/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileForms from '@/components/profile/ProfileForms'
import LeftSidebar from '@/components/sidebars/LeftSidebar'
import ProfileBanner from '@/components/profile/ProfileBanner'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.email) return <div className="p-6">Lütfen giriş yapın.</div>

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      avatarUrl: true,
      username: true,
      bannerUrl: true,
    },
  })
  if (!me) return <div className="p-6">Bulunamadı</div>

  return (
    <div className="space-y-6">
      <ProfileBanner src={me.bannerUrl} canEdit />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="hidden lg:block">
          <LeftSidebar />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <ProfileForms
            me={{
              id: me.id,
              name: me.name,
              bio: me.bio,
              avatarUrl: me.avatarUrl,
              email: me.email,
              username: me.username ?? null,
            }}
          />
        </div>
      </div>
    </div>
  )
}
