// src/components/home/ClubsTab.tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import ClubsSearchBar from '@/components/clubs/ClubsSearchBar'
import ClubFilters from '@/components/clubs/ClubFilters'
import PaginatedClubs from '@/components/PaginatedClubs'

export default function ClubsTab() {
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

  const page = Math.max(parseInt(params.get('page') || '1', 10) || 1, 1)

  function setParam(key: string, val?: string) {
    const s = new URLSearchParams(params.toString())
    if (!val) s.delete(key)
    else s.set(key, val)
    s.set('page', '1')
    router.replace(`/?${s.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-3">
      <ClubsSearchBar
        defaultValue={initialQuery.q || ''}
        onSearch={(q) => setParam('q', q || undefined)}
      />

      <ClubFilters
        defaultSubscribed={initialQuery.subscribed === '1'}
        onChange={(f) => setParam('subscribed', f.subscribed ? '1' : undefined)}
      />

      <PaginatedClubs initialQuery={initialQuery} page={page} pageSize={6} onPageChange={(p) => setParam('page', String(p))} />
    </div>
  )
}
