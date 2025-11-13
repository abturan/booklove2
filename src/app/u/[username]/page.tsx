// src/app/u/[username]/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { sanitizeHandle } from './_lib/handle'
import { findUserByHandle } from './_lib/findUser'
import { canonicalFromUser } from './_lib/canonical'
import ProfileLayout from './_components/ProfileLayout'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Tab = 'clubs' | 'posts'
type Props = { params: { username: string }; searchParams?: { tab?: Tab } }

export default async function PublicProfilePage({ params, searchParams }: Props) {
  await auth()
  const handle = sanitizeHandle(params.username)
  const user = await findUserByHandle(handle)
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="relative h-56 md:h-72 lg:h-80 rounded-3xl overflow-hidden bg-gray-100" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card p-5">Profil bulunamadı.</div>
          <div className="lg:col-span-2 space-y-6"><div className="card p-5">Bu profil henüz boş.</div></div>
        </div>
      </div>
    )
  }

  const canonical = canonicalFromUser(user)
  const urlTab = searchParams?.tab as Tab | undefined

  const [postCount, memberships] = await Promise.all([
    prisma.post.count({ where: { ownerId: user.id, status: 'PUBLISHED' } }),
    prisma.membership.count({ where: { userId: user.id, isActive: true } }),
  ])

  let defaultTab: Tab = 'posts'
  if (postCount > 0) defaultTab = 'posts'
  else if (memberships > 0) defaultTab = 'clubs'

  const activeTab: Tab = urlTab && (urlTab === 'clubs' || urlTab === 'posts') ? urlTab : defaultTab

  if (canonical && handle !== canonical) {
    redirect(`/u/${canonical}${activeTab ? `?tab=${encodeURIComponent(activeTab)}` : ''}`)
  }

  const modClub = await prisma.club.findFirst({
    where: { moderatorId: user.id, published: true },
    select: { id: true, name: true, slug: true, bannerUrl: true },
  })

  return <ProfileLayout user={user} activeTab={activeTab} modClub={modClub} />
}
