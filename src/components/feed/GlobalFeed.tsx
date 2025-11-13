// src/components/feed/GlobalFeed.tsx
'use client'

import React, { Fragment, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSession } from 'next-auth/react'
import PostComposer from '@/components/feed/PostComposer'
import PostCard, { type Post } from '@/components/feed/PostCard'
import AdCard from '@/components/ads/AdCard'

type Status = 'PUBLISHED' | 'PENDING' | 'HIDDEN' | 'REPORTED'

export default function GlobalFeed({
  ownerId,
  hideTopBar = false,
  active = true,
  focusPostId,
  scrollRoot = null,
  introPortal = null,
}: {
  ownerId?: string
  hideTopBar?: boolean
  active?: boolean
  focusPostId?: string | null
  scrollRoot?: HTMLElement | null
  introPortal?: HTMLElement | null
}) {
  const { data } = useSession()
  const loggedIn = !!data?.user?.id
  const status: Status = 'PUBLISHED'
  const [audience, setAudience] = useState<'global' | 'following'>('global')

  const [loading, setLoading] = useState<boolean>(true)
  const [hasRequested, setHasRequested] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [items, setItems] = useState<Post[]>([])
  const [ads, setAds] = useState<any[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const focusAttemptsRef = useRef(0)
  const [focusDone, setFocusDone] = useState(false)

  useEffect(() => {
    if (!active) return
    setLoading(true)
    setHasRequested(false)
    setError(null)
    setItems([])
    setCursor(null)
    setHasMore(true)
    void loadMore(true)
  }, [ownerId, status, audience, active])

  function buildQuery(limit = '10', extra?: string) {
    const q = new URLSearchParams()
    q.set('limit', limit)
    q.set('status', status)
    if (ownerId) {
      q.set('scope', 'owner')
      q.set('ownerId', ownerId)
    } else {
      q.set('scope', audience === 'following' ? 'following' : 'global')
    }
    if (extra) q.set('cursor', extra)
    return q
  }

  async function loadMore(isFirst = false) {
    if (!active) return
    setHasRequested(true)
    if (!hasMore) return
    setLoading(true)
    setError(null)
    try {
      const q = buildQuery('10', !isFirst && cursor ? cursor : undefined)
      const res = await fetch(`/api/posts?${q.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Akış yüklenemedi')
      const nextCursor = data?.nextCursor || null
      const newItems: Post[] = (data?.items || []).map(normalizePost)
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
    if (!active) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore(false)
      },
      { rootMargin: '400px 0px', root: scrollRoot ?? null }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [cursor, hasMore, active, scrollRoot])

  // fetch feed ads once
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
        const r = await fetch(`/api/ads/feed?device=${isMobile ? 'mobile' : 'desktop'}&scope=${audience === 'following' ? 'following' : 'global'}`, { cache: 'no-store' })
        const j = await r.json().catch(() => null)
        if (!cancelled && Array.isArray(j?.campaigns)) setAds(j.campaigns)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [audience])

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => {
      if (items.length === 0) return
      ;(async () => {
        try {
          const q = buildQuery('5')
          const res = await fetch(`/api/posts?${q.toString()}`, { cache: 'no-store' })
          const data = await res.json()
          if (!res.ok) return
          const fresh: Post[] = (data?.items || []).map(normalizePost)
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
  }, [items, status, ownerId, active])

  async function onPosted(newId: string) {
    if (!newId) return
    try {
      const res = await fetch(`/api/posts/${newId}`, { cache: 'no-store' })
      const j = await res.json()
      if (!res.ok || !j?.id) return
      const p = normalizePost(j)
      // Sadece yayınlanan gönderileri listeye alalım
      if ((p.status as any) !== 'PUBLISHED') return
      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id))
        return seen.has(p.id) ? prev : [p, ...prev]
      })
    } catch {}
  }
  function onUpdated(updated: Post) {
    setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }
  function onDeleted(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }

  const list: Post[] = items
  const showTopBar = !hideTopBar
  const showLoading = loading

  // Auto-focus a specific post id by loading more content until it's found
  useEffect(() => {
    if (!active || !focusPostId || focusDone) return
    const found = document.querySelector(`[data-post-id="${focusPostId}"]`) as HTMLElement | null
    if (found) {
      try {
        found.scrollIntoView({ behavior: 'smooth', block: 'center' })
        found.classList.add('ring-2', 'ring-primary')
        setTimeout(() => found.classList.remove('ring-2', 'ring-primary'), 2000)
      } catch {}
      setFocusDone(true)
      return
    }
    if (hasMore && !loading) void loadMore(false)
    else setFocusDone(true)
    focusAttemptsRef.current += 1
    if (focusAttemptsRef.current > 10) setFocusDone(true)
  }, [items, hasMore, loading, active, focusPostId, focusDone])

  const showIntro = showTopBar || (!ownerId && loggedIn)

  const introContent = showIntro ? (
    <div className="space-y-3">
      {!ownerId && loggedIn && <PostComposer onPosted={onPosted} />}
    </div>
  ) : null;

  const introNode = introPortal && introContent ? createPortal(introContent, introPortal) : null;
  const audienceSwitch = showTopBar ? (
    <div className="flex w-full items-center justify-between px-1">
      <span className="text-xl font-extrabold tracking-tight text-[#fa3d30]">Bookie!</span>
      <div className="inline-flex rounded-full border border-gray-200 bg-white p-0.5 text-xs shadow-sm">
        <button
          type="button"
          onClick={() => setAudience('global')}
          className={`px-3 py-1 rounded-full transition ${audience === 'global' ? 'bg-[#fa3d30] text-white' : 'text-gray-700 hover:bg-gray-50'}`}
          aria-pressed={audience === 'global'}
        >
          Herkes
        </button>
        <button
          type="button"
          onClick={() => setAudience('following')}
          className={`px-3 py-1 rounded-full transition ${audience === 'following' ? 'bg-[#fa3d30] text-white' : 'text-gray-700 hover:bg-gray-50'}`}
          aria-pressed={audience === 'following'}
        >
          Takip
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      {introNode}
      <aside className="space-y-4 pb-4 px-0 sm:px-1">
        {!introPortal && introContent}
        <div className="space-y-3 px-0 sm:px-1">
          {audienceSwitch}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          {(() => {
            const out: React.ReactNode[] = []
            const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
            const pinned = ads.filter((c: any) => c.campaign?.type === 'pinned_top' && c.creatives?.length)
            const rotating = ads.filter((c: any) => c.campaign?.type === 'rotate' && c.creatives?.length)

            if (pinned.length > 0) {
              const first = pinned[0]
              const creative = first.creatives[0]
              if (creative) {
                out.push(
                  <AdCard
                    key={`ad-pinned-${first.campaign.id}`}
                    ad={{ ...creative, slot: 'feed', campaignId: first.campaign.id }}
                    device={isMobile ? 'mobile' : 'desktop'}
                  />
                )
              }
            }

            const rotationIndex = new Map<string, number>()

            list.forEach((p, idx) => {
              out.push(
                <Fragment key={`feed-${p.id}`}>
                  <PostCard post={p} onUpdated={onUpdated} onDeleted={onDeleted} onPosted={onPosted} />
                </Fragment>
              )

              rotating.forEach((entry: any) => {
                const freq = Math.max(1, Number(entry.campaign?.frequency || 1))
                const creatives = entry.creatives || []
                if (creatives.length === 0) return
                const position = idx + 1
                if (position % freq !== 0) return
                const placed = rotationIndex.get(entry.campaign.id) || 0
                const pick = creatives[placed % creatives.length]
                rotationIndex.set(entry.campaign.id, placed + 1)
                out.push(
                  <AdCard
                    key={`ad-rot-${entry.campaign.id}-${idx}-${placed}`}
                    ad={{ ...pick, slot: 'feed', campaignId: entry.campaign.id }}
                    device={isMobile ? 'mobile' : 'desktop'}
                  />
                )
              })
            })

            return out
          })()}

          <div ref={sentinelRef} />

          <div className="flex justify-between items-center py-3 text-xs text-gray-600">
            <div>
              {showLoading && <span>Yükleniyor…</span>}
              {!showLoading && hasRequested && list.length === 0 && <span>Henüz paylaşım yok.</span>}
              {!showLoading && list.length > 0 && <span>Bitti</span>}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

// augment component with focus behavior by patching via hooks below
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useFocusBehavior() {}

// Focus helper effect (auto-scroll to a specific post id)
// We keep it outside the main return but inside file to avoid cluttering above logic
// NOTE: Placed after component to keep TS happy in single file.

function normalizePost(p: any): Post {
  return {
    id: String(p.id),
    body: String(p.body || ''),
    createdAt: String(p.createdAt || new Date().toISOString()),
    status: (p.status as any) || 'PUBLISHED',
    owner: {
      id: p.owner?.id || '',
      name: p.owner?.name || 'Kullanıcı',
      username: p.owner?.username || null,
      slug: p.owner?.slug || null,
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
    repostOf: p.repostOf
      ? {
          id: String(p.repostOf.id),
          body: String(p.repostOf.body || ''),
          createdAt: String(p.repostOf.createdAt || new Date().toISOString()),
          owner: {
            id: p.repostOf.owner?.id || '',
            name: p.repostOf.owner?.name || 'Kullanıcı',
            username: p.repostOf.owner?.username || null,
            slug: p.repostOf.owner?.slug || null,
            avatarUrl: p.repostOf.owner?.avatarUrl || null,
          },
          images: Array.isArray(p.repostOf.images)
            ? p.repostOf.images.map((i: any) => ({
                url: String(i.url || ''),
                width: typeof i.width === 'number' ? i.width : null,
                height: typeof i.height === 'number' ? i.height : null,
              }))
            : [],
        }
      : null,
  }
}
