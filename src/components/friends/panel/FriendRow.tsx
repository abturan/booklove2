// src/components/friends/panel/FriendRow.tsx
'use client'

import Link from 'next/link'
import type { UserLite } from '../types'
import Avatar from '@/components/Avatar'
import FriendAction from '@/components/sidebars/profile/FriendAction'

export default function FriendRow({
  u,
  userPath,
  allowUnfollow = true,
  online,
}: {
  u: UserLite
  userPath: (u?: string | null, n?: string | null, s?: string | null) => string
  allowUnfollow?: boolean
  online?: boolean
}) {
  const relationship = u.relationship ?? 'mutual'
  let mode: 'none' | 'message' | 'follow' | 'following' | 'followBack' = 'follow'
  if (relationship === 'mutual') mode = 'message'
  else if (relationship === 'following') mode = 'following'
  else if (relationship === 'follower') mode = 'followBack'

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl ring-1 ring-black/5 px-3 py-2">
      <Link href={userPath(u.username, u.name, u.slug)} className="flex items-center gap-3 min-w-0">
        <Avatar src={u.avatarUrl ?? null} size={36} alt={u.name || 'Kullanıcı'} seed={u.username || u.slug || u.id} online={online} />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{u.name || 'Kullanıcı'}</div>
          <div className="truncate text-xs text-gray-500">{u.username ? `@${u.username}` : u.slug ? `@${u.slug}` : ''}</div>
        </div>
      </Link>
      <div className="shrink-0">
        <FriendAction mode={mode} userId={u.id} appearance="compact" allowUnfollow={allowUnfollow} />
      </div>
    </div>
  )
}
