// src/components/SearchFilters.tsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'

type SortKey = 'members_desc' | 'members_asc' | 'created_desc' | 'created_asc'

function useDebounce<T>(value: T, delay = 250) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t) }, [value, delay])
  return v
}

export default function SearchFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const initialQ = params.get('q') ?? ''
  const initialSort = (params.get('sort') as SortKey) || 'members_desc'

  const [q, setQ] = useState(initialQ)
  const [sort, setSort] = useState<SortKey>(initialSort)
  const debouncedQ = useDebounce(q, 250)

  useEffect(() => {
    const s = new URLSearchParams(params.toString())
    debouncedQ ? s.set('q', debouncedQ) : s.delete('q')
    sort ? s.set('sort', sort) : s.delete('sort')
    router.replace(`${pathname}?${s.toString()}`, { scroll: false })
  }, [debouncedQ, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="top-[72px] z-20 mb-4 md:mb-6">
      <div className="rounded-2xl border border-gray-100 bg-white/70 backdrop-blur p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 w-full">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Yazar, kulüp veya moderatör ara…"
              className="pl-11"
              aria-label="Ara"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-3.6-3.6" />
            </svg>
          </div>

          <div className="hidden md:block w-[240px]">
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sırala"
            >
              <option value="members_desc">Kullanıcı sayısı (çoktan aza)</option>
              <option value="members_asc">Kullanıcı sayısı (azdan çoğa)</option>
              <option value="created_desc">Yeni eklenenler</option>
              <option value="created_asc">En eskiler</option>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}




