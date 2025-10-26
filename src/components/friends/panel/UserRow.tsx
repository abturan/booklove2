// src/components/friends/panel/UserRow.tsx
'use client'

import Link from 'next/link'
import type { UserLite } from '../types'

export default function UserRow({
  u,
  badge,
  userPath,
}: {
  u: UserLite
  badge?: string
  userPath: (u?: string | null, n?: string | null, s?: string | null) => string
}) {
  return (
    <Link href={userPath(u.username, u.name, u.slug)} className="flex items-center justify-between rounded-xl ring-1 ring-black/5 px-3 py-2 hover:bg-gray-50">
      <div className="flex items-center gap-3 min-w-0">
        <img src={u.avatarUrl || '/avatar.png'} alt={u.name || 'Avatar'} className="h-9 w-9 rounded-full object-cover" loading="lazy" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{u.name || 'Kullanıcı'}</div>
          <div className="truncate text-xs text-gray-500">{u.username ? `@${u.username}` : u.slug ? `@${u.slug}` : ''}</div>
        </div>
      </div>
      {badge && <span className="ml-3 shrink-0 rounded-full bg-gray-100 text-gray-600 px-2.5 h-7 inline-grid place-items-center text-[11px] font-semibold">{badge}</span>}
    </Link>
  )
}
