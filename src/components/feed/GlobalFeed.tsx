// src/components/feed/GlobalFeed.tsx
'use client'

import React, { Fragment, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Tabs from '@/components/ui/Tabs'
import PostComposer from '@/components/feed/PostComposer'
import PostCard, { type Post } from '@/components/feed/PostCard'
import AdCard from '@/components/ads/AdCard'

type Status = 'PUBLISHED' | 'PENDING' | 'HIDDEN' | 'REPORTED'
type PageBundle = { items: Post[]; cursorIn: string | null; cursorOut: string | null }

export default function GlobalFeed({
  ownerId,
  hideTopBar = false,
  paginateDesktop = false,
  leftColumnSelector,
  active = true,
  focusPostId,
}: {
  ownerId?: string
  hideTopBar?: boolean
  paginateDesktop?: boolean
  leftColumnSelector?: string
  active?: boolean
  focusPostId?: string | null
}) {
  const { data } = useSession()
  const loggedIn = !!data?.user?.id
  const isAdmin = (data?.user as any)?.role === 'ADMIN'
  const [status, setStatus] = useState<Status>('PUBLISHED')
  const [audience, setAudience] = useState<'global' | 'following'>('global')
  const [modOpen, setModOpen] = useState(false)

  const [counts, setCounts] = useState<{ published: number; pending: number; hidden: number; reported: number }>({
    published: 0,
    pending: 0,
    hidden: 0,
    reported: 0,
  })

  async function loadCounts() {
    try {
      const res = await fetch('/api/posts/counts', { cache: 'no-store' })
      const j = await res.json()
      if (res.ok) {
        setCounts({
          published: Number(j?.published ?? 0),
          pending: Number(j?.pending ?? 0),
          hidden: Number(j?.hidden ?? 0),
          reported: Number(j?.reported ?? 0),
        })
      }
    } catch {}
  }

  useEffect(() => {
    if (isAdmin && active) loadCounts()
  }, [isAdmin, status, active])

  const [clientReady, setClientReady] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    setClientReady(true)
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])

  const pagingEnabled = clientReady && isDesktop && !!paginateDesktop

  const [targetH, setTargetH] = useState<number>(0)
  const listRef = useRef<HTMLDivElement | null>(null)
  const leftElRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!pagingEnabled) return
    if (leftColumnSelector) {
      leftElRef.current = document.querySelector(leftColumnSelector) as HTMLElement | null
    }
    const leftEl = leftElRef.current
    if (!leftEl) return
    const update = () => setTargetH(leftEl.getBoundingClientRect().height)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(leftEl)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [pagingEnabled, leftColumnSelector])

  const [pages, setPages] = useState<PageBundle[]>([])
  const [pageIndex, setPageIndex] = useState(0)
  const current = pages[pageIndex] || null
  const [loading, setLoading] = useState<boolean>(true)
  const [hasRequested, setHasRequested] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [openComposer, setOpenComposer] = useState(false)

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
    if (pagingEnabled) {
      setPages([])
      setPageIndex(0)
      void loadPage(null, true, 6)
    } else {
      setItems([])
      setCursor(null)
      setHasMore(true)
      void loadMore(true)
    }
  }, [ownerId, status, audience, pagingEnabled, active])

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

  async function loadPage(cursorIn: string | null, replace = false, limitHint = 6) {
    if (!pagingEnabled || !active) return
    setHasRequested(true)
    setLoading(true)
    setError(null)
    try {
      const q = buildQuery(String(Math.max(3, limitHint)), cursorIn ?? undefined)
      const res = await fetch(`/api/posts?${q.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Akış yüklenemedi')
      const nextCursor = data?.nextCursor || null
      const newItems: Post[] = (data?.items || []).map(normalizePost)
      const bundle: PageBundle = { items: newItems, cursorIn, cursorOut: nextCursor }
      setPages((prev) => (replace ? [bundle] : [...prev, bundle]))
      setPageIndex((prev) => (replace ? 0 : prev + 1))
    } catch (e: any) {
      setError(e?.message || 'Akış yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  async function appendToCurrent(cursorIn: string, atIndex: number, limitHint = 4, silent = true) {
    if (!pagingEnabled || !active) return
    setHasRequested(true)
    if (!silent) setLoading(true)
    setError(null)
    try {
      const q = buildQuery(String(Math.max(2, limitHint)), cursorIn)
      const res = await fetch(`/api/posts?${q.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Akış yüklenemedi')
      const nextCursor = data?.nextCursor || null
      const more: Post[] = (data?.items || []).map(normalizePost)
      setPages((prev) =>
        prev.map((b, i) => (i === atIndex ? { ...b, items: [...b.items, ...more], cursorOut: nextCursor } : b))
      )
    } catch (e: any) {
      setError(e?.message || 'Akış yüklenemedi')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  function goNextPage() {
    if (!pagingEnabled || !active) return
    const cur = pages[pageIndex]
    if (!cur) return
    if (pages[pageIndex + 1]) {
      setPageIndex(pageIndex + 1)
      return
    }
    if (cur.cursorOut) void loadPage(cur.cursorOut, false, 6)
  }
  function goPrevPage() {
    if (!pagingEnabled || !active) return
    if (pageIndex > 0) setPageIndex(pageIndex - 1)
  }

  const fillingRef = useRef(false)
  const lastTrimCountRef = useRef<number | null>(null)

  useEffect(() => {
    if (!pagingEnabled || !active) return
    const at = pageIndex
    const cur = pages[at]
    if (!cur) return
    const wrap = listRef.current
    if (!wrap || targetH <= 0) return
    if (fillingRef.current) return
    const id = requestAnimationFrame(async () => {
      const total = wrap.getBoundingClientRect().height
      const low = targetH * 0.98
      const high = targetH * 1.02
      if (total < low && cur.cursorOut) {
        fillingRef.current = true
        await appendToCurrent(cur.cursorOut, at, 6, true)
        fillingRef.current = false
        return
      }
      if (total > high) {
        let acc = 0
        let fit = 0
        const gap = 12
        const children = Array.from(wrap.children) as HTMLElement[]
        for (const el of children) {
          const h = el.getBoundingClientRect().height
          if (acc + h > targetH) break
          acc += h + gap
          fit++
        }
        if (fit > 0 && fit < cur.items.length && fit !== lastTrimCountRef.current) {
          lastTrimCountRef.current = fit
          setPages((prev) => prev.map((b, i) => (i === at ? { ...b, items: b.items.slice(0, fit) } : b)))
        }
      } else {
        lastTrimCountRef.current = null
      }
    })
    return () => cancelAnimationFrame(id)
  }, [pages, pageIndex, targetH, pagingEnabled, active])

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
    if (pagingEnabled || !active) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore(false)
    }, { rootMargin: '400px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [sentinelRef.current, cursor, hasMore, pagingEnabled, active])

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
    if (pagingEnabled || !active) return
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
  }, [items, status, ownerId, pagingEnabled, active])

  async function onPosted(newId: string) {
    if (isAdmin) loadCounts()
    if (!newId) return
    try {
      const res = await fetch(`/api/posts/${newId}`, { cache: 'no-store' })
      const j = await res.json()
      if (!res.ok || !j?.id) return
      const p = normalizePost(j)
      // Sadece yayınlanan gönderileri listeye alalım
      if ((p.status as any) !== 'PUBLISHED') return
      if (pagingEnabled) {
        setPages((prev) => {
          if (!prev.length) return [{ items: [p], cursorIn: null, cursorOut: null }]
          const first = prev[0]
          // Çift kayıt engelle
          const seen = new Set(first.items.map((x) => x.id))
          const items = seen.has(p.id) ? first.items : [p, ...first.items]
          const next = [{ ...first, items }, ...prev.slice(1)]
          return next
        })
      } else {
        setItems((prev) => {
          const seen = new Set(prev.map((x) => x.id))
          return seen.has(p.id) ? prev : [p, ...prev]
        })
      }
    } catch {}
  }
  function onUpdated(updated: Post) {
    if (pagingEnabled) {
      setPages((prev) =>
        prev.map((b, i) => (i === pageIndex ? { ...b, items: b.items.map((p) => (p.id === updated.id ? updated : p)) } : b))
      )
    } else {
      setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    }
  }
  function onDeleted(id: string) {
    if (isAdmin) loadCounts()
    if (pagingEnabled) {
      setPages((prev) => prev.map((b, i) => (i === pageIndex ? { ...b, items: b.items.filter((p) => p.id !== id) } : b)))
    } else {
      setItems((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const list: Post[] = pagingEnabled ? (pages[pageIndex]?.items ?? []) : items
  const showTopBar = !hideTopBar
  const canPrev = pagingEnabled && pageIndex > 0
  const canNext = pagingEnabled && !!pages[pageIndex]?.cursorOut
  const showLoading = loading && !fillingRef.current

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
    // Not found yet: load more
    if (pagingEnabled) {
      const cur = pages[pageIndex]
      if (cur?.cursorOut && !loading) {
        void loadPage(cur.cursorOut, false, 6)
      } else if (pages[pageIndex + 1]) {
        setPageIndex(pageIndex + 1)
      } else {
        setFocusDone(true)
      }
    } else {
      if (hasMore && !loading) void loadMore(false)
      else setFocusDone(true)
    }
    focusAttemptsRef.current += 1
    if (focusAttemptsRef.current > 10) setFocusDone(true)
  }, [items, pages, pageIndex, hasMore, loading, active, focusPostId, focusDone, pagingEnabled])

  return (
    <aside className="space-y-4">
      {showTopBar && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-2xl font-extrabold tracking-tight">Bookie!</div>
          {loggedIn && !openComposer ? (
            <button
              type="button"
              onClick={() => setOpenComposer(true)}
              className="hidden md:inline-flex rounded-full bg-[#fa3d30] text-white px-4 py-1.5 text-sm font-medium hover:opacity-90"
              aria-label="Bookie! Paylaş"
            >
              Paylaş
            </button>
          ) : null}
          {loggedIn && openComposer ? (
            <button
              type="button"
              onClick={() => setOpenComposer(false)}
              className="hidden md:grid h-8 w-8 place-content-center rounded-full bg-[#fa3d30] text-white hover:opacity-90"
              aria-label="Kapat"
              title="Kapat"
            >
              ✕
            </button>
          ) : null}
        </div>
      )}

      {showTopBar && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-[220px]">
            {loggedIn && !openComposer && (
              <button
                type="button"
                onClick={() => setOpenComposer(true)}
                className="md:hidden inline-flex rounded-full bg-[#fa3d30] text-white px-4 py-1.5 text-sm font-medium hover:opacity-90"
                aria-label="Bookie! Paylaş (mobil)"
              >
                Paylaş
              </button>
            )}
            {loggedIn && openComposer && (
              <button
                type="button"
                onClick={() => setOpenComposer(false)}
                className="md:hidden inline-grid h-8 w-8 place-content-center rounded-full bg-[#fa3d30] text-white hover:opacity-90"
                aria-label="Kapat"
                title="Kapat"
              >
                ✕
              </button>
            )}
            <div className="h-1 w-full rounded-full bg-primary" />
          </div>
          <div className="shrink-0">
            <div className="inline-flex rounded-full border bg-white p-0.5 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => setAudience('global')}
                className={`px-3 py-1 rounded-full transition ${audience==='global' ? 'bg-[#fa3d30] text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                aria-pressed={audience==='global'}
              >
                Herkes
              </button>
              <button
                type="button"
                onClick={() => setAudience('following')}
                className={`px-3 py-1 rounded-full transition ${audience==='following' ? 'bg-[#fa3d30] text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                aria-pressed={audience==='following'}
              >
                Takip
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="space-y-2">
          {!modOpen ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setModOpen(true)}
                className="text-xs text-gray-500 underline hover:text-gray-700"
              >
                Moderasyon seçeneklerini aç
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setModOpen(false)}
                  className="text-xs text-gray-500 underline hover:text-gray-700"
                >
                  Gizle
                </button>
              </div>
              <Tabs
                value={status}
                onValueChange={(v) => setStatus(v as Status)}
                tabs={[
                  { value: 'PUBLISHED', label: `Yayında (${counts.published})` },
                  { value: 'PENDING', label: `Bekleyen (${counts.pending})` },
                  { value: 'HIDDEN', label: `Gizli (${counts.hidden})` },
                  { value: 'REPORTED', label: `Şikayet (${counts.reported})` },
                ]}
              />
            </div>
          )}
        </div>
      )}

      {openComposer && !ownerId && loggedIn && <PostComposer onPosted={onPosted} />}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div ref={listRef} className="space-y-3">
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
      </div>

      {!pagingEnabled && <div ref={sentinelRef} />}

      <div className="flex justify-between items-center py-3 text-xs text-gray-600">
        <div>
          {showLoading && <span>Yükleniyor…</span>}
          {!showLoading && hasRequested && list.length === 0 && <span>Henüz paylaşım yok.</span>}
          {!pagingEnabled && !showLoading && list.length > 0 && <span>Bitti</span>}
        </div>
        {pagingEnabled && (
          <div className="ml-auto flex items-center gap-2">
            <button onClick={goPrevPage} disabled={!canPrev} className="rounded-full border px-3 py-1.5 disabled:opacity-40">
              ← Önceki
            </button>
            <span className="px-2">Sayfa {pageIndex + 1}</span>
            <button onClick={goNextPage} disabled={!canNext} className="rounded-full border px-3 py-1.5 disabled:opacity-40">
              Sonraki →
            </button>
          </div>
        )}
      </div>
    </aside>
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
