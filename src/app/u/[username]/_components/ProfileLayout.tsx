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

type ModClub = { id: string; name: string; slug: string; bannerUrl: string | null } | null

export default async function ProfileLayout({
  user, activeTab, modClub = null,
}: { user:UserLite; activeTab:'clubs'|'posts'; modClub?: ModClub }) {
  const session = await auth()
  const meId = session?.user?.id || null

  let mode: 'none' | 'message' | 'sent' | 'pending' | 'canSend' = 'none'
  if (meId && meId !== user.id) {
    const accepted = await prisma.friendRequest.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { fromId: meId, toId: user.id },
          { fromId: user.id, toId: meId },
        ],
      },
      select: { id: true },
    })

    if (accepted) {
      mode = 'message'
    } else {
      const mine = await prisma.friendRequest.findFirst({
        where: { fromId: meId, toId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { status: true },
      })
      if (mine?.status === 'PENDING') {
        mode = 'sent'
      } else {
        const theirs = await prisma.friendRequest.findFirst({
          where: { fromId: user.id, toId: meId },
          orderBy: { createdAt: 'desc' },
          select: { status: true, respondedAt: true },
        })
        mode =
          theirs?.status === 'PENDING' && !theirs.respondedAt
            ? 'pending'
            : 'canSend'
      }
    }
  }

  const actionButtons =
    user.bio && user.bio.trim().length > 0
      ? (
        <div className="flex flex-wrap items-center gap-2">
          <ProfileAboutButton bio={user.bio} />
          {mode !== 'none' ? <FriendAction mode={mode} userId={user.id} /> : null}
        </div>
      )
      : mode !== 'none'
        ? <FriendAction mode={mode} userId={user.id} />
        : null

  return (
    <div className="space-y-6">
      <ProfileHero
        name={user.name || 'Kullanıcı'}
        username={user.username}
        avatarUrl={user.avatarUrl}
        bannerUrl={user.bannerUrl}
        actionSlot={actionButtons}
      />

     

      <div className="grid lg:grid-cols-3 gap-6">
        <div><PublicProfileSidebar userId={user.id} /></div>
        <ProfileMain user={user} active={activeTab} />
      </div>
    </div>
  )
}
