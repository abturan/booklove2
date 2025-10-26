// src/components/messages/ThreadList.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

type Peer = { id: string; name: string | null; username: string | null; slug: string | null; avatarUrl: string | null }
type Item = { threadId: string; peer: Peer; last?: { body: string; createdAt: string; authorId: string } }

const CACHE_KEY = 'dm:threads:v1'

export default function ThreadList({
  activeThreadId,
  activePeerId,
}: {
  activeThreadId?: string
  activePeerId?: string
}) {
  const [items, setItems] = React.useState<Item[]>([])
  const [loading, setLoading] = React.useState(true)
  const [counts, setCounts] = React.useState<Record<string, number>>({})

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/dm/threads', { cache: 'no-store' })
      const j = await res.json()
      if (res.ok) {
        setItems(j.items || [])
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(j.items || [])) } catch {}
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadCounts() {
    try {
      const res = await fetch('/api/dm/unread-counts', { cache: 'no-store' })
      const j = await res.json().catch(() => null)
      if (res.ok) setCounts(j?.items || {})
    } catch {}
  }

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) {
        const cached = JSON.parse(raw)
        if (Array.isArray(cached)) {
          setItems(cached)
          setLoading(false)
        }
      }
    } catch {}
    load()
    loadCounts()
    const h = () => { load(); loadCounts() }
    const h2 = () => loadCounts()
    const id = setInterval(loadCounts, 20000)
    window.addEventListener('friends:changed', h)
    window.addEventListener('dm:changed', h)
    window.addEventListener('dm:counts', h2)
    return () => {
      clearInterval(id)
      window.removeEventListener('friends:changed', h)
      window.removeEventListener('dm:changed', h)
      window.removeEventListener('dm:counts', h2)
    }
  }, [])

  return (
    <div className="card p-0 overflow-hidden">
      <div className="border-b px-4 py-4 font-medium text-lg font-semibold mb-2">Mesajlar</div>
      <ul className="max-h-[70vh] overflow-auto divide-y divide-gray-200">
        {loading && items.length === 0 ? (
          <li className="px-3 py-3 text-sm text-gray-600">Yükleniyor…</li>
        ) : items.length === 0 ? (
          <li className="px-3 py-3 text-sm text-gray-600">Sohbet bulunamadı.</li>
        ) : (
          items.map((it) => {
            const n = Number(counts[it.threadId] || 0)
            const isActiveByThread = activeThreadId === it.threadId
            const isActiveByPeer = activePeerId && activePeerId === it.peer.id
            const active = isActiveByThread || isActiveByPeer
            return (
              <li key={it.threadId}>
                <Link
                  href={`/messages/${it.threadId}`}
                  scroll={false}
                  prefetch
                  className={`flex items-center gap-3 px-3 py-3 hover:bg-gray-50 ${active ? 'bg-gray-50' : ''}`}
                >
                  <Avatar src={it.peer.avatarUrl ?? null} size={40} alt={it.peer.name || 'Kullanıcı'} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{it.peer.name || 'Kullanıcı'}</div>
                    <div className="text-xs text-gray-600 truncate">
                      {it.last?.body ? it.last.body : it.peer.username ? `@${it.peer.username}` : userPath(it.peer.username ?? undefined, it.peer.name ?? undefined, it.peer.slug ?? undefined)}
                    </div>
                  </div>
                  {n > 0 && (
                    <span className="ml-auto inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-white">
                      {n > 99 ? '99+' : n}
                    </span>
                  )}
                </Link>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
