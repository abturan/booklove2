// src/components/feed/InfiniteFeed.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import PostCard from './PostCard'

type Scope = 'friends' | 'self' | `user:${string}`
type Status = 'PUBLISHED' | 'PENDING' | 'HIDDEN' | 'REPORTED'

type Post = {
  id: string
  body: string
  createdAt: string
  owner: { id: string; name: string | null; username: string | null; slug: string | null; avatarUrl: string | null }
  images: { url: string; width?: number | null; height?: number | null }[]
  _count: { likes: number; comments: number }
  counts?: { likes: number; comments: number }
  status?: Status
}

export default function InfiniteFeed({ scope = 'friends', status = 'PUBLISHED' }: { scope?: Scope; status?: Status }) {
  const [items, setItems] = useState<Post[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentRef = useRef<HTMLDivElement | null>(null)
  const seenIdsRef = useRef<Set<string>>(new Set())

  async function load(first = false) {
    if (loading || !hasMore) return
    setLoading(true)
    setError(null)

    try {
      let base = '/api/posts?scope=friends'
      if (scope === 'self') base = '/api/posts?scope=self'
      else if (scope.startsWith('user:')) {
        const handle = scope.slice(5)
        base = `/api/users/${encodeURIComponent(handle)}/feed`
      }

      const params = new URLSearchParams()
      params.set('limit', '12')
      if (cursor && !first) params.set('cursor', cursor)
      if (status && base.startsWith('/api/posts')) params.set('status', status)

      const url = `${base}${base.includes('?') ? '&' : '?'}${params.toString()}`
      const res = await fetch(url, { cache: 'no-store' })

      if (!res.ok) {
        setHasMore(false)
        setError(`Bu kullanıcı henüz paylaşımda bulunmadı.`)
        return
      }

      const j = await res.json().catch(() => ({}))
      const rows: Post[] = Array.isArray(j.items) ? j.items : []
      const normalized = rows.map((p: any) => ({
        ...p,
        counts: {
          likes: Number((p._count?.likes ?? p.counts?.likes) || 0),
          comments: Number((p._count?.comments ?? p.counts?.comments) || 0),
        },
      }))

      const filtered = normalized.filter((p) => !seenIdsRef.current.has(p.id))
      filtered.forEach((p) => seenIdsRef.current.add(p.id))
      if (filtered.length) setItems((prev) => [...prev, ...filtered])

      if (j.nextCursor) setCursor(j.nextCursor as string)
      else setHasMore(false)
    } catch (e: any) {
      setError(e?.message || 'Bilinmeyen hata'); setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setItems([]); setCursor(null); setHasMore(true); setLoading(false)
    seenIdsRef.current.clear()
    load(true)
  }, [scope, status])

  useEffect(() => {
    const el = sentRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) load()
      },
      { rootMargin: '400px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [sentRef.current, cursor, hasMore, loading])

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 text-gray-700 px-3 py-2 text-sm">{error}</div>
      )}
      {items.map((p) => (
        <PostCard key={p.id} post={p as any} />
      ))}
      <div ref={sentRef} />
      <div className="flex justify-center py-3 text-sm text-gray-600">
        {loading ? 'Yükleniyor…' : !hasMore ? '' : null}
      </div>
    </div>
  )
}
