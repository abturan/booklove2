// src/app/page.tsx
'use client'

import { Suspense, useMemo, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import HeroSlider from '@/components/HeroSlider'
import SearchFilters from '@/components/SearchFilters'
import InfiniteClubs from '@/components/InfiniteClubs'
import Tabs from '@/components/ui/Tabs'
import PaginatedClubs from '@/components/PaginatedClubs'
import GlobalFeed from '@/components/feed/GlobalFeed'
import BookBuddyPanel from '@/components/friends/BookBuddyPanel'
import BookBuddyTab from '@/components/home/BookBuddyTab'

function usePendingBuddyCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const r = await fetch('/api/friends/pending/count', { cache: 'no-store' })
        const j = await r.json()
        if (alive && r.ok) setCount(Number(j?.count || 0))
      } catch {}
    }
    load()
    const t = setInterval(load, 20000)
    return () => { alive = false; clearInterval(t) }
  }, [])
  return count
}

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
  const pending = usePendingBuddyCount()

  const initialQuery = useMemo(() => {
    const obj: Record<string, string | undefined> = {}
    const q = params.get('q')
    const sort = params.get('sort')
    const subscribed = params.get('subscribed')
    if (q) obj.q = q
    if (sort) obj.sort = sort
    if (subscribed === '1') obj.subscribed = '1'
    return obj
  }, [params])

  const tabParam = params.get('tab') as 'clubs' | 'bookie' | 'buddy' | null
  const urlTab = tabParam ?? 'clubs'
  const page = Math.max(parseInt(params.get('page') || '1', 10) || 1, 1)

  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const apply = () => setIsDesktop(mq.matches)
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])

  const [mobileTab, setMobileTab] = useState<'clubs' | 'bookie' | 'buddy'>(urlTab)
  useEffect(() => { if (isDesktop) return; setMobileTab(urlTab) }, [urlTab, isDesktop])

  function setTab(next: 'clubs' | 'bookie' | 'buddy') {
    if (!isDesktop) { setMobileTab(next); return }
    const s = new URLSearchParams(params.toString())
    s.set('tab', next)
    s.delete('page')
    router.replace(`/?${s.toString()}`, { scroll: true })
  }

  function onPageChange(nextPage: number) {
    const s = new URLSearchParams(params.toString())
    s.set('tab', 'clubs')
    s.set('page', String(nextPage))
    router.replace(`/?${s.toString()}`, { scroll: true })
  }

  const activeTab = isDesktop ? urlTab : mobileTab

  return (
    <div className="space-y-6">
      <HeroSlider />

      <div className="md:hidden space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setTab(v as 'clubs' | 'bookie' | 'buddy')}
          tabs={[
            { value: 'clubs', label: 'Kulüpler' },
            { value: 'bookie', label: 'Bookie!' },
            { value: 'buddy', label: 'Book Buddy', badge: pending },
          ]}
        />
        <div aria-hidden={activeTab !== 'clubs'} className={activeTab === 'clubs' ? 'block' : 'hidden'}>
          <SearchFilters />
          <PaginatedClubs initialQuery={initialQuery} pageSize={6} page={page} onPageChange={onPageChange} />
        </div>
        <div aria-hidden={activeTab !== 'bookie'} className={activeTab === 'bookie' ? 'block' : 'hidden'}>
          <GlobalFeed hideTopBar={false} paginateDesktop={false} active={activeTab === 'bookie'} />
        </div>
        <div aria-hidden={activeTab !== 'buddy'} className={activeTab === 'buddy' ? 'block' : 'hidden'}>
          <BookBuddyTab active={activeTab === 'buddy'} />
        </div>
      </div>

      <div className="hidden md:block space-y-4">
        <SearchFilters />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.58fr)]">
          <div id="left-col" className="sticky bottom-4 self-end">
            <InfiniteClubs initialQuery={initialQuery} />
          </div>
          <div className="space-y-4">
            <BookBuddyPanel active />
            <GlobalFeed paginateDesktop leftColumnSelector="#left-col" active />
          </div>
        </div>
      </div>
    </div>
  )
}
