// src/components/messages/ThreadList.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

type Peer = { id: string; name: string | null; username: string | null; slug: string | null; avatarUrl: string | null }
type Item = {
  threadId: string
  peer: Peer
  last?: { body: string; createdAt: string; authorId: string }
  status: 'ACTIVE' | 'REQUESTED' | 'ARCHIVED'
  relation: 'self' | 'mutual' | 'following' | 'follower' | 'none'
  requestedById?: string | null
  requestedAt?: string | null
  canMessage?: boolean
}

const CACHE_KEY = 'dm:threads:v2'

export default function ThreadList({
  activeThreadId,
  activePeerId,
}: {
  activeThreadId?: string
  activePeerId?: string
}) {
  const { data: session } = useSession()
  const meId = (session?.user as any)?.id || null
  const [items, setItems] = React.useState<Item[]>([])
  const [loading, setLoading] = React.useState(true)
  const [counts, setCounts] = React.useState<Record<string, number>>({})
  const [respondingId, setRespondingId] = React.useState<string | null>(null)
  const [online, setOnline] = React.useState<Record<string, boolean>>({})

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/dm/threads', { cache: 'no-store' })
      const j = await res.json()
      if (res.ok) {
        const rows = (Array.isArray(j.items) ? j.items : []).map(normalizeItem)
        setItems(rows)
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(rows)) } catch {}
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

  async function loadOnline(peers: Item[]) {
    try {
      const ids = Array.from(new Set(peers.map((it) => it.peer.id))).filter(Boolean)
      if (ids.length === 0) return
      const res = await fetch(`/api/presence/lookup?ids=${encodeURIComponent(ids.join(','))}`, { cache: 'no-store' })
      const j = await res.json().catch(() => null)
      if (res.ok && j?.items) setOnline(j.items)
    } catch {}
  }

  const handleRespond = React.useCallback(
    async (threadId: string, action: 'ACCEPT' | 'DECLINE') => {
      setRespondingId(threadId)
      try {
        await respond(threadId, action)
        await load()
        await loadCounts()
      } finally {
        setRespondingId(null)
      }
    },
    [],
  )

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) {
        const cached = JSON.parse(raw)
        if (Array.isArray(cached)) {
          setItems(cached.map(normalizeItem))
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

  React.useEffect(() => {
    if (items.length === 0) return
    loadOnline(items)
    const id = setInterval(() => loadOnline(items), 60_000)
    return () => clearInterval(id)
  }, [items])

  return (
    <div className="card p-0 overflow-hidden">
      <div className="border-b px-4 py-4 font-medium text-lg font-semibold">Mesajlar</div>
      <div className="max-h-[70vh] overflow-auto">
        {loading && items.length === 0 ? (
          <div className="px-3 py-3 text-sm text-gray-600">Yükleniyor…</div>
        ) : (
          <>
            <MessageRequestSection items={items} meId={meId} respondingId={respondingId} onRespond={handleRespond} />
            <ActiveThreadsSection
              items={items}
              counts={counts}
              activeThreadId={activeThreadId}
              activePeerId={activePeerId}
              meId={meId}
              online={online}
            />
          </>
        )}
        {!loading && items.length === 0 && (
          <div className="px-3 py-3 text-sm text-gray-600">Sohbet bulunamadı.</div>
        )}
      </div>
    </div>
  )
}

function MessageRequestSection({
  items,
  meId,
  respondingId,
  onRespond,
}: {
  items: Item[]
  meId: string | null
  respondingId: string | null
  onRespond: (threadId: string, action: 'ACCEPT' | 'DECLINE') => void
}) {
  const requests = items.filter(
    (it) => it.status === 'REQUESTED' && it.requestedById && it.requestedById !== meId,
  )
  if (requests.length === 0) return null
  return (
    <div className="border-b border-gray-200">
      <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
        Book Buddy mesaj istekleri
      </div>
      <ul className="divide-y divide-gray-200">
        {requests.map((it) => {
          const pending = respondingId === it.threadId
          return (
            <li key={`request-${it.threadId}`} className="px-3 py-3">
              <div className="flex items-center gap-3">
                <Avatar src={it.peer.avatarUrl ?? null} size={40} alt={it.peer.name || 'Kullanıcı'} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{it.peer.name || 'Kullanıcı'}</div>
                  <div className="truncate text-xs text-gray-500">{it.peer.username ? `@${it.peer.username}` : ''}</div>
                  <p className="mt-1 text-xs text-gray-500">
                    {it.last?.body
                      ? it.last.body
                      : 'Bu kullanıcı sana Book Buddy mesaj isteği gönderdi.'}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Kabul ederseniz birbirinizin Book Buddy listesine ekleneceksiniz.
              </div>
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onRespond(it.threadId, 'DECLINE')}
                  disabled={pending}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                >
                  Reddet
                </button>
                <button
                  type="button"
                  onClick={() => onRespond(it.threadId, 'ACCEPT')}
                  disabled={pending}
                  className="rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  Kabul et
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ActiveThreadsSection({
  items,
  counts,
  activeThreadId,
  activePeerId,
  meId,
  online,
}: {
  items: Item[]
  counts: Record<string, number>
  activeThreadId?: string
  activePeerId?: string
  meId: string | null
  online?: Record<string, boolean>
}) {
  const threads = items.filter((it) => {
    if (it.status === 'REQUESTED' && it.requestedById && it.requestedById !== meId) return false
    return true
  })
  if (threads.length === 0) return null
  return (
    <ul className="divide-y divide-gray-200">
      {threads.map((it) => {
        const isRequestPending = it.status === 'REQUESTED' && it.requestedById === meId
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
              <Avatar src={it.peer.avatarUrl ?? null} size={40} alt={it.peer.name || 'Kullanıcı'} online={!!(online && online[it.peer.id])} />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{it.peer.name || 'Kullanıcı'}</div>
                <div className="text-xs text-gray-600 truncate">
                  {isRequestPending
                    ? 'Book Buddy mesaj isteğin onay bekliyor'
                    : it.last?.body
                    ? it.last.body
                    : it.peer.username
                    ? `@${it.peer.username}`
                    : userPath(it.peer.username ?? undefined, it.peer.name ?? undefined, it.peer.slug ?? undefined)}
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
      })}
    </ul>
  )
}

async function respond(threadId: string, action: 'ACCEPT' | 'DECLINE') {
  const res = await fetch('/api/friends/respond', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ threadId, action }),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => null)
    throw new Error(j?.error || 'Hata')
  }
  window.dispatchEvent(new CustomEvent('friends:changed'))
  window.dispatchEvent(new Event('dm:changed'))
}

function normalizeItem(raw: any): Item {
  const peer = raw?.peer || {}
  return {
    threadId: String(raw?.threadId || ''),
    peer: {
      id: String(peer?.id || ''),
      name: peer?.name ?? null,
      username: peer?.username ?? null,
      slug: peer?.slug ?? null,
      avatarUrl: peer?.avatarUrl ?? null,
    },
    last: raw?.last,
    status: raw?.status ?? 'ACTIVE',
    relation: raw?.relation ?? 'none',
    requestedById: raw?.requestedById ?? null,
    requestedAt: raw?.requestedAt ?? null,
    canMessage: raw?.canMessage ?? true,
  }
}
