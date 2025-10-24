// src/components/feed/GlobalFeed.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Tabs from '@/components/ui/Tabs'
import PostComposer from '@/components/feed/PostComposer'
import PostCard, { type Post } from '@/components/feed/PostCard'

type Status = 'PUBLISHED' | 'PENDING' | 'HIDDEN'
type PageBundle = { items: Post[]; cursorIn: string | null; cursorOut: string | null }

export default function GlobalFeed({
  ownerId,
  hideTopBar = false,
  paginateDesktop = false,
  leftColumnSelector,
}: {
  ownerId?: string
  hideTopBar?: boolean
  paginateDesktop?: boolean
  leftColumnSelector?: string
}) {
  const { data } = useSession()
  const loggedIn = !!data?.user?.id
  const isAdmin = (data?.user as any)?.role === 'ADMIN'
  const [status, setStatus] = useState<Status>('PUBLISHED')

  // Hydration-safe cihaz tespiti
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

  // Sol kolon yüksekliği (desktop sayfalama)
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

  // Veri durumu
  const [pages, setPages] = useState<PageBundle[]>([])
  const [pageIndex, setPageIndex] = useState(0)
  const current = pages[pageIndex] || null
  const [loading, setLoading] = useState<boolean>(true)
  const [hasRequested, setHasRequested] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [openComposer, setOpenComposer] = useState(false)

  // Sonsuz mod (mobil) için
  const [items, setItems] = useState<Post[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Mod/filtre değişiminde sıfırlama ve ilk yük
  useEffect(() => {
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
  }, [ownerId, status, pagingEnabled])

  function buildQuery(limit = '10', extra?: string) {
    const q = new URLSearchParams()
    q.set('limit', limit)
    q.set('status', status)
    if (ownerId) {
      q.set('scope', 'owner')
      q.set('ownerId', ownerId)
    } else {
      q.set('scope', 'global')
    }
    if (extra) q.set('cursor', extra)
    return q
  }

  // ===== Desktop: Sayfa yükleme =====
  async function loadPage(cursorIn: string | null, replace = false, limitHint = 6) {
    if (!pagingEnabled) return
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

  // otomatik doldurma için loading'i UI'ya göstermeden ekleme
  async function appendToCurrent(cursorIn: string, atIndex: number, limitHint = 4, silent = true) {
    if (!pagingEnabled) return
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
    if (!pagingEnabled) return
    const cur = pages[pageIndex]
    if (!cur) return
    if (pages[pageIndex + 1]) {
      setPageIndex(pageIndex + 1)
      return
    }
    if (cur.cursorOut) void loadPage(cur.cursorOut, false, 6)
  }
  function goPrevPage() {
    if (!pagingEnabled) return
    if (pageIndex > 0) setPageIndex(pageIndex - 1)
  }

  // Sağ listeyi sola hizala (yükseklik bazlı ekle/kırp) — thrash engelli
  const fillingRef = useRef(false)
  const lastTrimCountRef = useRef<number | null>(null)

  useEffect(() => {
    if (!pagingEnabled) return
    const at = pageIndex
    const cur = pages[at]
    if (!cur) return
    const wrap = listRef.current
    if (!wrap || targetH <= 0) return
    if (fillingRef.current) return

    // ölçümü paint sonrası yap, histerezis ekle
    const id = requestAnimationFrame(async () => {
      const total = wrap.getBoundingClientRect().height
      const low = targetH * 0.98
      const high = targetH * 1.02

      // Az ise: sessiz doldur (loading yazısı gözükmez)
      if (total < low && cur.cursorOut) {
        fillingRef.current = true
        await appendToCurrent(cur.cursorOut, at, 6, true)
        fillingRef.current = false
        return
      }

      // Fazlaysa: kaç kart sığar → bir kez kırp
      if (total > high) {
        let acc = 0
        let fit = 0
        const gap = 12 // .space-y-3
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
        // tam sığdı — bir sonraki ölçümde tekrar kırpmaya çalışma
        lastTrimCountRef.current = null
      }
    })
    return () => cancelAnimationFrame(id)
  }, [pages, pageIndex, targetH, pagingEnabled])

  // ===== Mobil/sonsuz =====
  async function loadMore(isFirst = false) {
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
    if (pagingEnabled) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore(false)
    }, { rootMargin: '400px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [sentinelRef.current, cursor, hasMore, pagingEnabled])

  useEffect(() => {
    if (pagingEnabled) return
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
  }, [items, status, ownerId, pagingEnabled])

  function onPosted() {
    setLoading(true)
    setHasRequested(false)
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

  // otomatik doldurma sırasında loading yazısını gizle
  const showLoading = loading && !fillingRef.current

  return (
    <aside className="space-y-4">
      {showTopBar && (
        <div className="flex items-end justify-between">
          <div className="text-2xl font-extrabold tracking-tight">Bookie!</div>
          {loggedIn && !openComposer ? (
            <button
              type="button"
              onClick={() => setOpenComposer(true)}
              className="rounded-full bg-primary text-white px-4 py-1.5 text-sm font-medium hover:bg-primary/90"
              aria-label="Bookie! Paylaş"
            >
              Paylaş
            </button>
          ) : null}
          {loggedIn && openComposer ? (
            <button
              type="button"
              onClick={() => setOpenComposer(false)}
              className="h-8 w-8 grid place-content-center rounded-full bg-primary text-white hover:bg-primary/90"
              aria-label="Kapat"
              title="Kapat"
            >
              ✕
            </button>
          ) : null}
        </div>
      )}

      {showTopBar && <div className="h-1 w-full rounded-full bg-primary" />}

      {isAdmin && (
        <Tabs
          value={status}
          onValueChange={(v) => setStatus(v as Status)}
          tabs={[
            { value: 'PUBLISHED', label: 'Yayında' },
            { value: 'PENDING', label: 'Bekleyen' },
            { value: 'HIDDEN', label: 'Gizli' },
          ]}
        />
      )}

      {openComposer && !ownerId && loggedIn && <PostComposer onPosted={onPosted} />}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div ref={listRef} className="space-y-3">
        {list.map((p) => (
          <PostCard key={p.id} post={p} onUpdated={onUpdated} onDeleted={onDeleted} />
        ))}
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
  }
}
