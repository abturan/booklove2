// src/app/page.tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import HeroSlider from '@/components/HeroSlider'
import SearchFilters from '@/components/SearchFilters'
import InfiniteClubs from '@/components/InfiniteClubs'
import Tabs from '@/components/ui/Tabs'
import PaginatedClubs from '@/components/PaginatedClubs'
import GlobalFeed from '@/components/feed/GlobalFeed'

export default function Home() {
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

  const tab = (params.get('tab') || 'clubs') as 'clubs' | 'bookie'
  const page = Math.max(parseInt(params.get('page') || '1', 10) || 1, 1)

  function onTabChange(next: 'clubs' | 'bookie') {
    const s = new URLSearchParams(params.toString())
    s.set('tab', next)
    if (next === 'clubs') s.set('page', '1')
    router.replace(`/?${s.toString()}`, { scroll: false })
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
          onValueChange={(v) => onTabChange(v as 'clubs' | 'bookie')}
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
