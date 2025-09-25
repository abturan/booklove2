// src/app/u/[username]/page.tsx
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import PublicProfileSidebar from '@/components/sidebars/PublicProfileSidebar'
import InfiniteFeed from '@/components/feed/InfiniteFeed'
import Avatar from '@/components/Avatar'
import ProfileBanner from '@/components/profile/ProfileBanner'

type Props = { params: { username: string } }

export const dynamic = 'force-dynamic'

function deslug(s: string) {
  return s.replace(/-/g, ' ').trim()
}

function iVariants(s: string) {
  return Array.from(new Set([s, s.replace(/ı/g, 'i'), s.replace(/i/g, 'ı')])).filter(Boolean)
}

export default async function PublicProfilePage({ params }: Props) {
  const session = await auth()
  const viewerId = session?.user?.id || null
  const handle = (params.username || '').trim()

  let user = await prisma.user.findUnique({
    where: { username: handle },
    select: { id: true, name: true, username: true, bio: true, avatarUrl: true, bannerUrl: true },
  })

  if (!user) {
    const base = deslug(handle)
    for (const variant of iVariants(base)) {
      const u = await prisma.user.findFirst({
        where: { name: { equals: variant, mode: 'insensitive' } },
        select: { id: true, name: true, username: true, bio: true, avatarUrl: true, bannerUrl: true },
      })
      if (u) { user = u; break }
    }
  }

  if (!user) return <div className="p-6">Kullanıcı bulunamadı.</div>

  const canEdit = viewerId === user.id

  return (
    <div className="space-y-6">
      <ProfileBanner src={user.bannerUrl} canEdit={!!canEdit} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div>
          <PublicProfileSidebar userId={user.id} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Avatar src={user.avatarUrl ?? null} seed={user.id} size={48} alt={user.name || user.username || 'Profil'} />
              <div className="min-w-0">
                <h1 className="text-lg font-semibold truncate">
                  {user.name || user.username || ''}
                </h1>
                <div className="text-sm text-gray-600">{user.username ? `@${user.username}` : ''}</div>
              </div>
            </div>
            {user.bio && <p className="mt-4 text-gray-800">{user.bio}</p>}
          </div>

          <InfiniteFeed scope={`user:${user.username || user.name}`} />
        </div>
      </div>
    </div>
  )
}
