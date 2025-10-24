// src/app/u/[slug]/page.tsx
import { prisma } from '@/lib/prisma'
import Avatar from '@/components/Avatar'
import ModeratorClubCard from '@/components/clubs/ModeratorClubCard'

export const dynamic = 'force-dynamic'

export default async function UserPublicPage({ params }: { params: { slug: string } }) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: params.slug }, { slug: params.slug }] },
    select: { id: true, name: true, username: true, avatarUrl: true },
  })
  if (!user) return <div className="p-6">Kullanıcı bulunamadı.</div>

  const modClub = await prisma.club.findFirst({
    where: { moderatorId: user.id, published: true }, // ❗️yalnızca aktif kulüp
    select: { id: true, name: true, slug: true, bannerUrl: true },
  })

  return (
    <div className="space-y-6">
      <div className="card p-6 flex items-center gap-3">
        <Avatar src={user.avatarUrl ?? null} size={56} alt={user.name || 'Kullanıcı'} />
        <div>
          <div className="text-lg font-semibold">{user.name}</div>
          <div className="text-sm text-gray-600">@{user.username}</div>
        </div>
      </div>

      {modClub && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold px-1">Moderatörü Olduğu Kulüp</h3>
          <ModeratorClubCard club={modClub} />
        </div>
      )}
    </div>
  )
}
