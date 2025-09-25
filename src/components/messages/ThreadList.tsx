// src/components/messages/ThreadList.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

type Peer = { id: string; name: string | null; username: string | null; avatarUrl: string | null }
type Item = { threadId: string; peer: Peer; last?: { body: string; createdAt: string; authorId: string } }

export default function ThreadList({ activePeerId }: { activePeerId?: string }) {
  const [items, setItems] = React.useState<Item[]>([])
  const [loading, setLoading] = React.useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/dm/threads', { cache: 'no-store' })
      const j = await res.json()
      if (res.ok) setItems(j.items || [])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('friends:changed', h)
    window.addEventListener('dm:changed', h)
    return () => {
      window.removeEventListener('friends:changed', h)
      window.removeEventListener('dm:changed', h)
    }
  }, [])

  return (
    <div className="card p-0 overflow-hidden">
      <div className="border-b px-3 py-2 text-sm font-medium">Mesajlar</div>
      <ul className="max-h-[70vh] overflow-auto">
        {loading ? (
          <li className="px-3 py-3 text-sm text-gray-600">Yükleniyor…</li>
        ) : items.length === 0 ? (
          <li className="px-3 py-3 text-sm text-gray-600">Sohbet bulunamadı.</li>
        ) : (
          items.map((it) => (
            <li key={it.threadId}>
              <Link
                href={`/messages/${it.peer.id}`}
                className={`flex items-center gap-3 px-3 py-3 hover:bg-gray-50 ${activePeerId === it.peer.id ? 'bg-gray-50' : ''}`}
              >
                <Avatar src={it.peer.avatarUrl ?? null} size={36} alt={it.peer.name || 'Kullanıcı'} />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{it.peer.name || 'Kullanıcı'}</div>
                  <div className="text-xs text-gray-600 truncate">
                    {it.last?.body ? it.last.body : it.peer.username ? `@${it.peer.username}` : userPath(it.peer.username ?? undefined, it.peer.name ?? undefined)}
                  </div>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
    

