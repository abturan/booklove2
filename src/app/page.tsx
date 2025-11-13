// src/app/page.tsx
'use client'

import { Suspense, useMemo, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import clsx from 'clsx'
import HeroSlider from '@/components/HeroSlider'
import SearchFilters from '@/components/SearchFilters'
import InfiniteClubs from '@/components/InfiniteClubs'
// import PaginatedClubs from '@/components/PaginatedClubs'
import GlobalFeed from '@/components/feed/GlobalFeed'
import BookBuddyTab from '@/components/home/BookBuddyTab'
import HomeCalendar from '@/components/home/HomeCalendar'

export const dynamic = 'force-dynamic'
const SHOW_HERO = false

export default function Home() {
  return (
    <Suspense fallback={<div className="p-6">Yükleniyor…</div>}>
      <HomeBody />
    </Suspense>
  )
}

function HomeBody() {
  const params = useSearchParams()
  const router = useRouter()
  const focusId = params.get('focus')

  const initialQuery = useMemo(() => {
    const obj: Record<string, string | undefined> = {}
    const q = params.get('q')
    const sort = params.get('sort')
    const subscribed = params.get('subscribed')
    const soldout = params.get('soldout')
    const past = params.get('past')
    if (q) obj.q = q
    if (sort) obj.sort = sort
    if (subscribed === '1') obj.subscribed = '1'
    if (soldout === '1') obj.soldout = '1'
    if (past === '1') obj.past = '1'
    return obj
  }, [params])

  const tabParam = params.get('tab') as 'clubs' | 'bookie' | 'buddy' | null
  const urlTab = tabParam ?? 'bookie'
  // Mobile artık sayfalama kullanmıyor; page paramı gereksiz

  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const apply = () => setIsDesktop(mq.matches)
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])

  const [mobileTab, setMobileTab] = useState<'clubs' | 'bookie' | 'buddy'>(urlTab)
  const [mobileIntroHost, setMobileIntroHost] = useState<HTMLDivElement | null>(null)
  const [desktopIntroHost, setDesktopIntroHost] = useState<HTMLDivElement | null>(null)
  useEffect(() => { if (isDesktop) return; setMobileTab(urlTab) }, [urlTab, isDesktop])

  function setTab(next: 'clubs' | 'bookie' | 'buddy') {
    if (!isDesktop) { setMobileTab(next); return }
    const s = new URLSearchParams(params.toString())
    s.set('tab', next)
    s.delete('page')
    router.replace(`/?${s.toString()}`, { scroll: true })
  }

  // Not: Mobilde sayfalama iptal — infinite scroll kullanılacak

  const activeTab = isDesktop ? urlTab : mobileTab
  const [feedScrollRoot, setFeedScrollRoot] = useState<HTMLElement | null>(null)
  const handleFeedScrollRef = useCallback((node: HTMLDivElement | null) => {
    setFeedScrollRoot((prev) => (prev === node ? prev : node))
  }, [])

  const [leftColumnEl, setLeftColumnEl] = useState<HTMLDivElement | null>(null)
  const [leftColumnHeight, setLeftColumnHeight] = useState<number | null>(null)

  useEffect(() => {
    if (!isDesktop) {
      setLeftColumnHeight(null)
      return
    }
    if (!leftColumnEl) {
      setLeftColumnHeight(null)
      return
    }
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const borderBox = Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : entry.borderBoxSize
      const nextHeight = borderBox?.blockSize ?? entry.contentRect.height
      setLeftColumnHeight(nextHeight)
    })
    observer.observe(leftColumnEl)
    return () => observer.disconnect()
  }, [isDesktop, leftColumnEl])

  const shouldLockRightColumn = isDesktop && leftColumnHeight !== null
  const rightColumnStyle = shouldLockRightColumn ? { height: `${leftColumnHeight}px` } : undefined
  const feedScrollAreaStyle = shouldLockRightColumn ? undefined : { maxHeight: 'min(72vh, 720px)' }
  const feedScrollAreaClass = shouldLockRightColumn
    ? 'flex-1 min-h-0 overflow-y-auto px-1 py-3 lg:px-2'
    : 'flex-1 overflow-y-auto px-1 py-3 lg:px-2 min-h-[420px]'

  const effectiveScrollRoot = isDesktop ? feedScrollRoot : null

  const mobileSections: Array<{ value: 'bookie' | 'clubs' | 'buddy'; label: string; helper: string }> = [
    { value: 'bookie', label: 'Akış', helper: 'Gönderiler' },
    { value: 'clubs', label: 'Kulüpler', helper: 'Keşfet' },
    { value: 'buddy', label: 'Buddy', helper: 'Eşleş' },
  ]

  return (
    <div className="space-y-6">
      {SHOW_HERO && <HeroSlider />}
      <HomeCalendar />

      <div className="md:hidden space-y-5">
        <section className="rounded-3xl bg-gradient-to-r from-[#fa3d30] via-[#ff5b4a] to-[#ff9660] p-5 text-white shadow-xl ring-1 ring-white/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/70">Topluluk</p>
              <h1 className="text-3xl font-black tracking-tight">book.love</h1>
              <p className="text-sm text-white/85">Gönderileri, kulüpleri ve arkadaşlarını tek akışta takip et.</p>
            </div>
            <button
              type="button"
              onClick={() => setTab('bookie')}
              className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm"
            >
              Akışa dön
            </button>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Mobil sekmeler">
            {mobileSections.map((tab) => {
              const selected = activeTab === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setTab(tab.value)}
                  className={clsx(
                    'flex min-w-[110px] flex-col rounded-2xl border px-4 py-2 text-left text-sm font-semibold transition',
                    selected
                      ? 'border-white bg-white text-[#fa3d30]'
                      : 'border-white/25 bg-white/10 text-white/90'
                  )}
                >
                  <span>{tab.label}</span>
                  <span className="text-xs font-normal text-white/70">{tab.helper}</span>
                </button>
              )
            })}
          </div>
        </section>

        {activeTab === 'bookie' && (
          <section className="rounded-3xl border border-white/70 bg-white/95 p-3 shadow-soft">
            <div ref={setMobileIntroHost} className="mb-3" />
            <GlobalFeed
              hideTopBar={false}
              active
              focusPostId={focusId}
              introPortal={mobileIntroHost}
            />
          </section>
        )}

        {activeTab === 'clubs' && (
          <section className="space-y-4 rounded-3xl border border-white/70 bg-white/95 p-4 shadow-soft">
            <div className="rounded-2xl bg-gray-50 p-3">
              <Suspense fallback={<div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />}>
                <SearchFilters />
              </Suspense>
            </div>
            <InfiniteClubs initialQuery={initialQuery} pageSize={6} />
          </section>
        )}

        {activeTab === 'buddy' && (
          <section className="rounded-3xl border border-white/70 bg-white/95 p-4 shadow-soft">
            <BookBuddyTab active />
          </section>
        )}
      </div>

      <div className="hidden md:block space-y-4">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.58fr)]">
          <div ref={setLeftColumnEl}>
            <InfiniteClubs initialQuery={initialQuery} />
          </div>
          <div className="flex h-full min-h-0 flex-col" style={rightColumnStyle}>
            <div ref={setDesktopIntroHost} className="mb-4" />
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div ref={handleFeedScrollRef} className={`${feedScrollAreaClass} scrollbar-none`} style={feedScrollAreaStyle}>
                <GlobalFeed active focusPostId={focusId} scrollRoot={effectiveScrollRoot} introPortal={desktopIntroHost} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
