// src/components/friends/panel/OutgoingRow.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { UserLite } from '../types'

export default function OutgoingRow({
  u,
  onCancel,
  userPath,
}: {
  u: UserLite
  onCancel: () => Promise<void> | void
  userPath: (u?: string | null, n?: string | null, s?: string | null) => string
}) {
  const [pending, setPending] = useState(false)

  async function handleCancel() {
    if (pending) return
    setPending(true)
    try { await onCancel() } finally { setPending(false) }
  }

  return (
    <div className="flex items-center justify-between rounded-xl ring-1 ring-black/5 px-3 py-2">
      <Link href={userPath(u.username, u.name, u.slug)} className="flex items-center gap-3 min-w-0">
        <img src={u.avatarUrl || '/avatar.png'} alt={u.name || 'Avatar'} className="h-9 w-9 rounded-full object-cover" loading="lazy" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{u.name || 'Kullanıcı'}</div>
          <div className="truncate text-xs text-gray-500">{u.username ? `@${u.username}` : u.slug ? `@${u.slug}` : ''}</div>
        </div>
      </Link>
      <div className="ml-3 flex items-center gap-2 shrink-0 whitespace-nowrap">
        <span className="rounded-full bg-amber-100 text-amber-700 px-3 h-7 grid place-items-center text-[11px] font-semibold">
          Beklemede
        </span>
        <button
          type="button"
          onClick={handleCancel}
          disabled={pending}
          className={`rounded-full px-3 h-7 text-[12px] font-semibold text-white ${pending ? 'bg-gray-500' : 'bg-gray-900 hover:bg-black'} active:scale-[0.98] disabled:opacity-70`}
        >
          {pending ? 'İptal ediliyor…' : 'İptal Et'}
        </button>
      </div>
    </div>
  )
}
