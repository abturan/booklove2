// src/components/InfiniteClubs.tsx
'use client'

import * as React from 'react'
import ClubCard from '@/components/ClubCard'

type RawClub = any

type Club = {
  id: string
  slug: string
  name: string
  bannerUrl: string | null
  priceTRY: number
  description: string | null
  moderator: { id: string; name: string; avatarUrl?: string | null; username?: string | null; slug?: string | null } | null
  memberCount: number
  pickCount: number
  capacity?: number | null
}

function normalizeClub(x: RawClub, fallbackKey: string): Club | null {
  if (!x || typeof x !== 'object') return null
  const id = (x.id ?? x._id ?? '').toString()
  const slug = (x.slug ?? '').toString()
  const name = (x.name ?? '').toString()
  if (!(id || slug) || !name) return null

  return {
    id: id || `tmp-${fallbackKey}`,
    slug,
    name,
    description: x.description ?? null,
    bannerUrl: x.bannerUrl ?? null,
    priceTRY: typeof x.priceTRY === 'number' ? x.priceTRY : 0,
    moderator: x.moderator
      ? {
          id: x.moderator.id ?? '',
          name: x.moderator.name ?? '',
          avatarUrl: x.moderator.avatarUrl ?? null,
          username: x.moderator.username ?? null,
          slug: x.moderator.slug ?? null,
        }
      : x.owner
      ? {
          id: x.owner.id ?? '',
          name: x.owner.name ?? '',
          avatarUrl: x.owner.avatarUrl ?? null,
          username: x.owner.username ?? null,
          slug: x.owner.slug ?? null,
        }
      : null,
    memberCount:
      typeof x.memberCount === 'number'
        ? x.memberCount
        : typeof x._count?.memberships === 'number'
        ? x._count.memberships
        : 0,
    pickCount:
      typeof x.pickCount === 'number'
        ? x.pickCount
        : Array.isArray(x.picks)
        ? x.picks.length
        : typeof x._count?.picks === 'number'
        ? x._count.picks
        : 0,
    capacity:
      typeof x.capacity === 'number'
        ? x.capacity
        : x.capacity == null
        ? null
        : undefined,
  }
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.items)) return payload.items
    if (Array.isArray(payload.clubs)) return payload.clubs
    if (Array.isArray(payload.data)) return payload.data
  }
  return []
}

type Props = {
  initialQuery?: Record<string, string | undefined>
  pageSize?: number
}

export default function InfiniteClubs({ initialQuery = {}, pageSize = 12 }: Props) {
  const [items, setItems] = React.useState<Club[]>([])
  const [cursor, setCursor] = React.useState<string | null>(null)
  const [hasMore, setHasMore] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const sentinelRef = React.useRef<HTMLDivElement | null>(null)
  const queryRef = React.useRef(initialQuery)

  React.useEffect(() => {
    queryRef.current = initialQuery
    resetAndLoad()
  }, [JSON.stringify(initialQuery)])

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
      Object.entries(queryRef.current || {}).forEach(([k, v]) => {
        if (typeof v === 'string' && v.length) q.set(k, v)
      })
      q.set('limit', String(pageSize))
      if (!isFirst && cursor) q.set('cursor', cursor)

      const res = await fetch(`/api/clubs?${q.toString()}`, { cache: 'no-store' })
      const data = await res.json()

      const raw = extractList(data)
      const normalized: Club[] = raw
        .map((x: any, idx: number) => normalizeClub(x, `${Date.now()}-${idx}`))
        .filter(Boolean) as Club[]

      setItems((prev) => {
        const seen = new Set(prev.map((c) => c.id))
        const merged = [...prev]
        for (const c of normalized) {
          if (!seen.has(c.id)) {
            merged.push(c)
            seen.add(c.id)
          }
        }
        return merged
      })

      if ((data as any)?.nextCursor) {
        setCursor(String((data as any).nextCursor))
        setHasMore(true)
      } else {
        if (normalized.length < pageSize) setHasMore(false)
      }
    } catch (e: any) {
      setError(e?.message || 'Liste yüklenemedi.')
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
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

  const safeItems = items.filter(Boolean)

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {safeItems.length === 0 && !loading && (
        <div className="text-sm text-gray-600">Kulüp bulunamadı.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {safeItems.map((club, i) => {
          const key = club.id || `${club.slug || 'club'}-${i}`
          return <ClubCard key={key} club={club} />
        })}
      </div>

      <div ref={sentinelRef} />

      <div className="flex justify-center py-4">
        {loading && <span className="text-sm text-gray-600">Yükleniyor…</span>}
        {!hasMore && safeItems.length > 0 && (
          <span className="text-sm text-gray-500">❤️❤️❤️</span>
        )}
      </div>
    </div>
  )
}
