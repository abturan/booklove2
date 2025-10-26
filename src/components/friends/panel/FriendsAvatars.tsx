// src/components/friends/panel/FriendsAvatars.tsx
'use client'

import Link from 'next/link'
import type { UserLite } from '../types'

export default function FriendsAvatars({
  friends,
  userPath,
}: {
  friends: UserLite[]
  userPath: (u?: string | null, n?: string | null, s?: string | null) => string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {friends.map((f) => (
        <Link key={f.id} href={userPath(f.username, f.name, f.slug)} className="inline-flex items-center rounded-full ring-1 ring-black/10" title={f.name || ''}>
          <img src={f.avatarUrl || '/avatar.png'} alt={f.name || 'Avatar'} className="h-10 w-10 rounded-full object-cover" loading="lazy" />
        </Link>
      ))}
    </div>
  )
}
