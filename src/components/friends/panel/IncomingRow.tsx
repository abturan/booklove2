// src/components/friends/panel/IncomingRow.tsx
'use client'

import Link from 'next/link'
import type { UserLite } from '../types'

export default function IncomingRow({
  u, onAccept, userPath, showRequestLabel = true,
}: {
  u: UserLite; onAccept: () => void
  userPath: (u?: string|null, n?: string|null, s?: string|null) => string
  showRequestLabel?: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-xl ring-1 ring-black/5 px-3 py-2">
      <Link href={userPath(u.username, u.name, u.slug)} className="flex items-center gap-3 min-w-0">
        <img src={u.avatarUrl || '/avatar.png'} alt={u.name || 'Avatar'} className="h-9 w-9 rounded-full object-cover" loading="lazy" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{u.name || 'Kullanıcı'}</div>
          <div className="truncate text-xs text-gray-500">{u.username ? `@${u.username}` : u.slug ? `@${u.slug}` : ''}</div>
        </div>
      </Link>
      <div className="ml-3 flex items-center gap-2 shrink-0">
        {showRequestLabel && <span className="rounded-full bg-blue-50 text-blue-700 px-3 h-7 grid place-items-center text-[11px] font-semibold">İstek</span>}
        <button type="button" onClick={onAccept} className="rounded-full bg-primary text-white px-3 h-7 text-[12px] font-semibold hover:bg-primary/90 active:scale-[0.98]">Kabul Et</button>
      </div>
    </div>
  )
}
