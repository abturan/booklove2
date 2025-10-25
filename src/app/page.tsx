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
  const tab = tabParam ?? 'clubs'
  const page = Math.max(parseInt(params.get('page') || '1', 10) || 1, 1)

  function setTab(next: 'clubs' | 'bookie' | 'buddy') {
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

  return (
    <div className="space-y-6">
      <HeroSlider />

      {/* MOBİL */}
      <div className="md:hidden space-y-4">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as 'clubs' | 'bookie' | 'buddy')}
          tabs={[
            { value: 'clubs', label: 'Kulüpler' },
            { value: 'bookie', label: 'Bookie!' },
            { value: 'buddy', label: 'Book Buddy', badge: pending },
          ]}
        />
        {tab === 'clubs' ? (
          <>
            <SearchFilters />
            <PaginatedClubs initialQuery={initialQuery} pageSize={6} page={page} onPageChange={onPageChange} />
          </>
        ) : tab === 'bookie' ? (
          <GlobalFeed />
        ) : (
          <BookBuddyTab />
        )}
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block space-y-4">
        <SearchFilters />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.58fr)]">
          <div id="left-col" className="sticky bottom-4 self-end">
            <InfiniteClubs initialQuery={initialQuery} />
          </div>
          <div className="space-y-4">
            <BookBuddyPanel />
            <GlobalFeed paginateDesktop leftColumnSelector="#left-col" />
          </div>
        </div>
      </div>
    </div>
  )
}
