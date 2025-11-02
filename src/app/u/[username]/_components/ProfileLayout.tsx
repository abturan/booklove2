// src/app/u/[username]/_components/ProfileLayout.tsx
import ProfileHero from '@/components/profile/ProfileHero'
import PublicProfileSidebar from '@/components/sidebars/PublicProfileSidebar'
import type { UserLite } from '../_lib/findUser'
import ProfileMain from './ProfileMain'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import FriendAction from '@/components/sidebars/profile/FriendAction'
import ModeratorClubCard from '@/components/clubs/ModeratorClubCard'
import ProfileAboutButton from '@/components/profile/ProfileAboutButton'
import { getFollowRelation } from '@/lib/follow'
import ProfileMessageButton from '@/components/profile/ProfileMessageButton'

type ModClub = { id: string; name: string; slug: string; bannerUrl: string | null } | null

export default async function ProfileLayout({
  user, activeTab, modClub = null,
}: { user:UserLite; activeTab:'clubs'|'posts'; modClub?: ModClub }) {
  const session = await auth()
  const meId = session?.user?.id || null

  let mode: 'none' | 'message' | 'follow' | 'following' | 'followBack' = 'none'
  if (meId && meId !== user.id) {
    const relation = await getFollowRelation(meId, user.id)
    if (relation === 'mutual') mode = 'message'
    else if (relation === 'following') mode = 'following'
    else if (relation === 'follower') mode = 'followBack'
    else mode = 'follow'
  }

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      {user.bio && user.bio.trim().length > 0 ? <ProfileAboutButton bio={user.bio} /> : null}
      {mode !== 'none' ? (
        <>
          <FriendAction mode={mode} userId={user.id} showMessageButton={false} />
          {mode === 'message' ? <ProfileMessageButton userId={user.id} /> : null}
        </>
      ) : null}
    </div>
  )

  return (
    <div className="space-y-6">
      <ProfileHero
        name={user.name || 'Kullanıcı'}
        username={user.username}
        avatarUrl={user.avatarUrl}
        bannerUrl={user.bannerUrl}
        actionSlot={actionButtons}
        ctaSlot={undefined}
      />

     

      <div className="grid lg:grid-cols-3 gap-6">
        <div><PublicProfileSidebar userId={user.id} /></div>
        <ProfileMain user={user} active={activeTab} />
      </div>
    </div>
  )
}
