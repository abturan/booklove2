// src/components/friends/panel/FriendRow.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { UserLite } from '../types'

export default function FriendRow({
  u,
  userPath,
  showBuddyLabel = true,
}: {
  u: UserLite
  userPath: (u?: string | null, n?: string | null, s?: string | null) => string
  showBuddyLabel?: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function startChat() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/dm/open?peerId=${encodeURIComponent(u.id)}`, { cache: 'no-store' })
      const j = await res.json().catch(() => null)
      if (res.ok && j?.threadId) {
        router.push(`/messages/${j.threadId}`)
        router.refresh()
        window.dispatchEvent(new CustomEvent('dm:changed'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl ring-1 ring-black/5 px-3 py-2">
      <Link href={userPath(u.username, u.name, u.slug)} className="flex items-center gap-3 min-w-0">
        <img src={u.avatarUrl || '/avatar.png'} alt={u.name || 'Avatar'} className="h-9 w-9 rounded-full object-cover" loading="lazy" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{u.name || 'Kullanıcı'}</div>
          <div className="truncate text-xs text-gray-500">{u.username ? `@${u.username}` : u.slug ? `@${u.slug}` : ''}</div>
        </div>
      </Link>
      <div className="ml-3 flex items-center gap-2 shrink-0 whitespace-nowrap">
        {showBuddyLabel && <span className="rounded-full bg-gray-100 text-gray-700 px-3 h-8 inline-grid place-items-center text-xs font-semibold">Book Buddy</span>}
        <button
          type="button"
          onClick={startChat}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-full bg-primary text-white h-8 px-3 md:px-4 text-xs md:text-[12px] font-semibold hover:bg-primary/90 disabled:opacity-60"
          aria-label="Mesaj Gönder"
        >
          <svg className="md:mr-1" width="14" height="14" viewBox="0 0 24 24"><path d="M4 6h16v12H4z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M22 6l-10 7L2 6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
          <span className="hidden md:inline">{busy ? 'Açılıyor…' : 'Mesaj Gönder'}</span>
        </button>
      </div>
    </div>
  )
}
