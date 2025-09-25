// src/components/friends/IncomingItem.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

type U = { id: string; name: string | null; username: string | null; avatarUrl: string | null }

export default function IncomingItem({ requestId, user }: { requestId: string; user: U }) {
  const [gone, setGone] = useState(false)
  const [busy, setBusy] = useState<'ACCEPT' | 'IGNORE' | 'DECLINE' | null>(null)

  async function act(action: 'ACCEPT' | 'IGNORE' | 'DECLINE') {
    if (busy) return
    setBusy(action)
    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })
      const isJson = res.headers.get('content-type')?.includes('application/json')
      const j = isJson ? await res.json().catch(() => ({} as any)) : ({ ok: res.ok } as any)
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Hata')
      setGone(true)
      window.dispatchEvent(new CustomEvent('friends:changed'))
    } catch (e: any) {
      alert(e?.message || 'Hata oluştu')
    } finally {
      setBusy(null)
    }
  }

  if (gone) return null

  return (
    <li className="py-3 flex items-center justify-between gap-3">
      <Link href={userPath(user.username ?? undefined, user.name ?? undefined)} className="flex items-center gap-3">
        <Avatar src={user.avatarUrl ?? null} size={36} alt={user.name || 'Kullanıcı'} />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{user.name || 'Kullanıcı'}</div>
          <div className="text-xs text-gray-600 truncate">{user.username ? `@${user.username}` : ''}</div>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <button
          onClick={() => act('ACCEPT')}
          disabled={busy !== null}
          className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs disabled:opacity-60"
        >
          {busy === 'ACCEPT' ? 'Onaylanıyor…' : 'Onayla'}
        </button>
       
        <button
          onClick={() => act('DECLINE')}
          disabled={busy !== null}
          className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs disabled:opacity-60"
        >
          {busy === 'DECLINE' ? 'Reddediliyor…' : 'Reddet'}
        </button>
      </div>
    </li>
  )
}
