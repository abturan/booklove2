// src/app/u/[username]/_components/ProfileMain.tsx
import ProfileAboutCard from '@/components/profile/ProfileAboutCard'
import UserClubsGrid from '@/components/profile/UserClubsGrid'
import InfiniteFeed from '@/components/feed/InfiniteFeed'
import { slugify } from '@/lib/slugify'
import type { UserLite } from '../_lib/findUser'
import ProfileTabs from './ProfileTabs'

export default function ProfileMain({
  user, canonical, active,
}: { user:UserLite; canonical:string; active:'about'|'clubs'|'posts' }) {
  const aboutNode = <ProfileAboutCard bio={user.bio ?? ''} />
  const clubsNode = <UserClubsGrid userId={user.id} />
  const postsNode = (
    <div className="space-y-6">
      <InfiniteFeed scope={`user:${user.username || user.slug || slugify((user.name || '').trim())}`} />
    </div>
  )
  return (
    <div className="lg:col-span-2 space-y-4">
      <ProfileTabs initialActive={active} aboutNode={aboutNode} clubsNode={clubsNode} postsNode={postsNode} />
    </div>
  )
}
