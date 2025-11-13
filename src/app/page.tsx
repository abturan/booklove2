// src/app/page.tsx
'use client'

import { Suspense, useMemo, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import HeroSlider from '@/components/HeroSlider'
import SearchFilters from '@/components/SearchFilters'
import InfiniteClubs from '@/components/InfiniteClubs'
import Tabs from '@/components/ui/Tabs'
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

  return (
    <div className="space-y-6">
      {SHOW_HERO && <HeroSlider />}
      <HomeCalendar />

      <div className="md:hidden space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setTab(v as 'clubs' | 'bookie' | 'buddy')}
          tabs={[
            { value: 'bookie', label: 'Bookie!' },
            { value: 'clubs', label: 'Kulüpler' },
            { value: 'buddy', label: 'Book Buddy' },
          ]}
        />
        <div aria-hidden={activeTab !== 'bookie'} className={activeTab === 'bookie' ? 'block' : 'hidden'}>
          {activeTab === 'bookie' && <div ref={setMobileIntroHost} className="mb-4" />}
          <GlobalFeed
            hideTopBar={false}
            active={activeTab === 'bookie'}
            focusPostId={focusId}
            introPortal={activeTab === 'bookie' ? mobileIntroHost : null}
          />
        </div>
        <div aria-hidden={activeTab !== 'clubs'} className={activeTab === 'clubs' ? 'block' : 'hidden'}>
          <Suspense fallback={null}>
            <SearchFilters />
          </Suspense>
          <InfiniteClubs initialQuery={initialQuery} pageSize={6} />
        </div>
        <div aria-hidden={activeTab !== 'buddy'} className={activeTab === 'buddy' ? 'block' : 'hidden'}>
          <BookBuddyTab active={activeTab === 'buddy'} />
        </div>
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
