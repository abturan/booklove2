// src/components/PaginatedClubs.tsx
'use client'

import * as React from 'react'
import ClubCard from '@/components/ClubCard'

type Club = {
  id: string
  slug: string
  name: string
  bannerUrl: string | null
  priceTRY: number
  description: string | null
  moderator: { id: string; name: string; avatarUrl?: string | null } | null
  memberCount: number
  pickCount: number
  capacity?: number | null
}

type Props = {
  initialQuery?: Record<string, string | undefined>
  pageSize?: number
  page?: number
  onPageChange?: (n: number) => void
}

export default function PaginatedClubs({
  initialQuery = {},
  pageSize = 6,
  page = 1,
  onPageChange,
}: Props) {
  const [items, setItems] = React.useState<Club[]>([])
  const [total, setTotal] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true); setError(null)
      try {
        const q = new URLSearchParams()
        Object.entries(initialQuery).forEach(([k, v]) => v && q.set(k, v))
        q.set('limit', String(pageSize))
        q.set('page', String(page))
        const res = await fetch(`/api/events?${q.toString()}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Liste yüklenemedi')
        const arr = Array.isArray(data?.items) ? data.items
          : Array.isArray(data?.events) ? data.events
          : Array.isArray(data) ? data
          : []
        const norm: Club[] = arr.map((x: any, i: number) => ({
          id: String(x.id ?? `${Date.now()}-${i}`),
          slug: String(x.slug ?? ''),
          name: String(x.name ?? ''),
          description: x.description ?? null,
          bannerUrl: x.bannerUrl ?? null,
          priceTRY: typeof x.priceTRY === 'number' ? x.priceTRY : 0,
          moderator: x.moderator ? { id: x.moderator.id ?? '', name: x.moderator.name ?? '', avatarUrl: x.moderator.avatarUrl ?? null } : null,
          memberCount: typeof x.memberCount === 'number' ? x.memberCount : (x._count?.memberships ?? 0),
          pickCount: typeof x.pickCount === 'number' ? x.pickCount : (x._count?.events ?? 0),
          capacity: typeof x.capacity === 'number' ? x.capacity : (x.capacity == null ? null : undefined),
        }))
        if (!cancelled) {
          setItems(norm)
          // Backend may not provide total; if fewer than pageSize, infer last page
          const inferredTotal = typeof data?.total === 'number' ? data.total : (norm.length < pageSize ? page * pageSize - (pageSize - norm.length) : null)
          setTotal(inferredTotal)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Liste yüklenemedi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [JSON.stringify(initialQuery), page, pageSize])

  const pageCount = total != null ? Math.max(Math.ceil(total / pageSize), 1) : null

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 sm:gap-y-3">
            {items.map((club) => (
              <div key={club.id} className="relative w-full pb-[100%]">
                <ClubCard club={club} className="absolute inset-0" />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              type="button"
              onClick={() => onPageChange?.(Math.max(page - 1, 1))}
              disabled={page <= 1}
              className="h-9 px-3 rounded-full border bg-white text-sm disabled:opacity-50"
            >
              Önceki
            </button>
            <div className="text-sm text-gray-600">
              Sayfa {page}{pageCount ? ` / ${pageCount}` : ''}
            </div>
            <button
              type="button"
              onClick={() => onPageChange?.(page + 1)}
              disabled={!!pageCount && page >= pageCount}
              className="h-9 px-3 rounded-full border bg-white text-sm disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>

          {loading && <div className="text-sm text-gray-600 mt-3">Yükleniyor…</div>}
        </div>

        <div className="hidden lg:block">
          {/* Sağ sütun boş; istenirse burada öneriler vb. */}
        </div>
      </div>
    </div>
  )
}
