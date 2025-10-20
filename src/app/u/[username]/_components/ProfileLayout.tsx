// src/app/u/[username]/_components/ProfileLayout.tsx
import ProfileHero from '@/components/profile/ProfileHero'
import PublicProfileSidebar from '@/components/sidebars/PublicProfileSidebar'
import type { UserLite } from '../_lib/findUser'
import ProfileMain from './ProfileMain'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import FriendAction from '@/components/sidebars/profile/FriendAction'
import ModeratorClubCard from '@/components/clubs/ModeratorClubCard'

type ModClub = { id: string; name: string; slug: string; bannerUrl: string | null } | null

export default async function ProfileLayout({
  user, canonical, activeTab, modClub = null,
}: { user:UserLite; canonical:string; activeTab:'about'|'clubs'|'posts'; modClub?: ModClub }) {
  const session = await auth()
  const meId = session?.user?.id || null

  let mode: 'none' | 'message' | 'sent' | 'pending' | 'canSend' = 'none'
  if (meId && meId !== user.id) {
    const pairs = await prisma.friendRequest.findMany({
      where: { OR: [{ fromId: meId, toId: user.id }, { fromId: user.id, toId: meId }] },
      select: { fromId: true, toId: true, status: true, respondedAt: true },
      orderBy: { createdAt: 'desc' },
    })
    if (pairs.some((p) => p.status === 'ACCEPTED')) mode = 'message'
    else {
      const mine = pairs.find((p) => p.fromId === meId && p.toId === user.id)
      const theirs = pairs.find((p) => p.fromId === user.id && p.toId === meId)
      mode = mine?.status === 'PENDING' ? 'sent' : theirs?.status === 'PENDING' && !theirs.respondedAt ? 'pending' : 'canSend'
    }
  }

  return (
    <div className="space-y-6">
      <ProfileHero
        name={user.name || 'Kullanıcı'}
        username={user.username}
        avatarUrl={user.avatarUrl}
        bannerUrl={user.bannerUrl}
        actionSlot={mode !== 'none' ? <FriendAction mode={mode} userId={user.id} /> : null}
      />

      {modClub && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold px-1">Moderatörü Olduğu Kulüp</h3>
          <ModeratorClubCard club={modClub} />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div><PublicProfileSidebar userId={user.id} /></div>
        <ProfileMain user={user} canonical={canonical} active={activeTab} />
      </div>
    </div>
  )
}
