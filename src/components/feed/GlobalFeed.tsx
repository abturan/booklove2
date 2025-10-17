// src/components/feed/GlobalFeed.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import PostComposer from '@/components/feed/PostComposer'
import PostCard, { type Post } from '@/components/feed/PostCard'

export default function GlobalFeed() {
  const [items, setItems] = useState<Post[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openComposer, setOpenComposer] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    resetAndLoad()
  }, [])

  async function resetAndLoad() {
    setItems([])
    setCursor(null)
    setHasMore(true)
    await loadMore(true)
  }

  async function loadMore(isFirst = false) {
    if (loading || !hasMore) return
    setLoading(true)
    setError(null)
    try {
      const q = new URLSearchParams()
      q.set('scope', 'global')
      q.set('limit', '10')
      if (!isFirst && cursor) q.set('cursor', cursor)
      const res = await fetch(`/api/posts?${q.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Akış yüklenemedi')
      const nextCursor = data?.nextCursor || null
      const newItems: Post[] = (data?.items || []).map((p: any) => normalizePost(p))
      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id))
        const merged = [...prev]
        for (const it of newItems) if (!seen.has(it.id)) merged.push(it)
        return merged
      })
      setCursor(nextCursor)
      setHasMore(!!nextCursor)
    } catch (e: any) {
      setError(e?.message || 'Akış yüklenemedi')
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting) loadMore(false)
      },
      { rootMargin: '400px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [sentinelRef.current, cursor, hasMore, loading])

  useEffect(() => {
    const t = setInterval(() => {
      if (items.length === 0) return
      ;(async () => {
        try {
          const q = new URLSearchParams()
          q.set('scope', 'global')
          q.set('limit', '5')
          const res = await fetch(`/api/posts?${q.toString()}`, { cache: 'no-store' })
          const data = await res.json()
          if (!res.ok) return
          const fresh: Post[] = (data?.items || []).map((p: any) => normalizePost(p))
          const newestId = items[0]?.id
          const idx = fresh.findIndex((x) => x.id === newestId)
          const prepend = idx > 0 ? fresh.slice(0, idx) : fresh
          if (prepend.length > 0) {
            setItems((prev) => {
              const seen = new Set(prev.map((x) => x.id))
              const merged = [...prepend.filter((x) => !seen.has(x.id)), ...prev]
              return merged
            })
          }
        } catch {}
      })()
    }, 10000)
    return () => clearInterval(t)
  }, [items])

  function onPosted(createdId: string) {
    ;(async () => {
      try {
        const res = await fetch(`/api/posts?scope=self&limit=1`, { cache: 'no-store' })
        const data = await res.json()
        const newest: Post[] = (data?.items || []).map((p: any) => normalizePost(p))
        if (newest[0]) setItems((prev) => [newest[0], ...prev])
      } catch {}
    })()
  }

  function onUpdated(updated: Post) {
    setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  function onDeleted(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <aside className="sticky top-4 space-y-4">
      <div className="flex items-end justify-between">
        <div className="text-2xl font-extrabold tracking-tight">Bookie!</div>
        <button
          type="button"
          onClick={() => setOpenComposer((v) => !v)}
          className="rounded-full bg-rose-600 text-white px-4 py-1.5 text-sm font-medium hover:bg-rose-700"
        >
          {openComposer ? 'Kapat' : 'Paylaş'}
        </button>
      </div>
      <div className="h-1 w-full rounded-full bg-rose-500" />
      {openComposer && <PostComposer onPosted={onPosted} />}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {items.map((p) => (
          <PostCard key={p.id} post={p} onUpdated={onUpdated} onDeleted={onDeleted} />
        ))}
      </div>

      <div ref={sentinelRef} />
      <div className="flex justify-center py-3">
        {loading && <span className="text-xs text-gray-600">Yükleniyor…</span>}
        {!hasMore && items.length > 0 && <span className="text-xs text-gray-500">Bitti</span>}
      </div>
    </aside>
  )
}

function normalizePost(p: any): Post {
  return {
    id: String(p.id),
    body: String(p.body || ''),
    createdAt: String(p.createdAt || new Date().toISOString()),
    owner: {
      id: p.owner?.id || '',
      name: p.owner?.name || 'Kullanıcı',
      username: p.owner?.username || null,
      avatarUrl: p.owner?.avatarUrl || null,
    },
    images: Array.isArray(p.images)
      ? p.images.map((i: any) => ({
          url: String(i.url || ''),
          width: typeof i.width === 'number' ? i.width : null,
          height: typeof i.height === 'number' ? i.height : null,
        }))
      : [],
    counts: { likes: Number(p._count?.likes || 0), comments: Number(p._count?.comments || 0) },
  }
}
