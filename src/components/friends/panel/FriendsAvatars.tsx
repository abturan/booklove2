// src/components/friends/panel/FriendsAvatars.tsx
'use client'

import Link from 'next/link'
import type { UserLite } from '../types'
import Avatar from '@/components/Avatar'

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
        <Link
          key={f.id}
          href={userPath(f.username, f.name, f.slug)}
          className="inline-flex items-center rounded-full ring-1 ring-black/10"
          title={f.name || ''}
        >
          <Avatar src={f.avatarUrl} size={40} alt={f.name || f.username || 'Kullanıcı'} seed={f.username || f.slug || f.id} />
        </Link>
      ))}
    </div>
  )
}
