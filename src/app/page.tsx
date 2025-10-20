// src/app/page.tsx
'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import HeroSlider from '@/components/HeroSlider'
import SearchFilters from '@/components/SearchFilters'
import InfiniteClubs from '@/components/InfiniteClubs'
import Tabs from '@/components/ui/Tabs'
import PaginatedClubs from '@/components/PaginatedClubs'
import GlobalFeed from '@/components/feed/GlobalFeed'

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

  const tab = (params.get('tab') as 'clubs' | 'bookie') ?? 'clubs'
  const page = Math.max(parseInt(params.get('page') || '1', 10) || 1, 1)

  function setTab(next: 'clubs' | 'bookie') {
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

      <div className="md:hidden space-y-4">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as 'clubs' | 'bookie')}
          tabs={[
            { value: 'clubs', label: 'Klüpler' },
            { value: 'bookie', label: 'Bookie!' },
          ]}
        />

        {tab === 'clubs' ? (
          <>
            <SearchFilters />
            <PaginatedClubs
              initialQuery={initialQuery}
              pageSize={6}
              page={page}
              onPageChange={onPageChange}
            />
          </>
        ) : (
          <GlobalFeed />
        )}
      </div>

      <div className="hidden md:block space-y-4">
        <SearchFilters />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.58fr)]">
          <div className="sticky bottom-4 self-end">
            <InfiniteClubs initialQuery={initialQuery} />
          </div>
          <div>
            <GlobalFeed />
          </div>
        </div>
      </div>
    </div>
  )
}
