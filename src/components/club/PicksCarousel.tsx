// src/components/club/PicksCarousel.tsx
'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

type PickBase = {
  monthKey: string
  title: string
  author: string
  coverUrl: string
}
type CurrentPick = {
  title: string
  author: string
  translator: string | null
  pages: number | null
  isbn: string | null
  coverUrl: string
  note: string | null
  monthKey: string
}

function monthTitleTR(monthKey: string) {
  const [y, m] = monthKey.split('-').map((n) => parseInt(n, 10))
  const d = new Date(Date.UTC(y, (m || 1) - 1, 1))
  const month = new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(d)
  const cap = month.charAt(0).toUpperCase() + month.slice(1)
  return `${cap} seçkisi`
}

export default function PicksCarousel({
  slug,
  current,
  prev,
  next,
}: {
  slug: string
  current: CurrentPick | null
  prev: PickBase | null
  next: PickBase | null
}) {
  const slides = useMemo(() => {
    const arr: { key: string; data: CurrentPick | PickBase }[] = []
    if (prev) arr.push({ key: `prev-${prev.monthKey}`, data: prev })
    if (current) arr.push({ key: `cur-${current.monthKey}`, data: current })
    if (next) arr.push({ key: `next-${next.monthKey}`, data: next })
    return arr
  }, [current, prev, next])

  const initialIndex = Math.max(0, slides.findIndex((s) => s.key.startsWith('cur-')))
  const [index, setIndex] = useState(initialIndex === -1 ? 0 : initialIndex)

  const canPrev = index > 0
  const canNext = index < slides.length - 1
  const slide = slides[index]

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{slide ? monthTitleTR((slide.data as any).monthKey) : 'Seçki'}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border px-2 py-1 text-sm disabled:opacity-40"
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            disabled={!canPrev}
            aria-label="Önceki seçki"
          >
            ←
          </button>
          <button
            type="button"
            className="rounded-full border px-2 py-1 text-sm disabled:opacity-40"
            onClick={() => setIndex((i) => Math.min(i + 1, slides.length - 1))}
            disabled={!canNext}
            aria-label="Sonraki seçki"
          >
            →
          </button>
        </div>
      </div>

      {!slide ? (
        <div className="mt-2 text-gray-600 text-sm">Kayıt yok</div>
      ) : (
        <div className="mt-3 grid grid-cols-[auto,1fr] gap-3">
          <div className="relative w-12 h-16 rounded overflow-hidden bg-gray-100">
            <Image src={(slide.data as any).coverUrl} alt={(slide.data as any).title} fill className="object-cover" />
          </div>
          <div className="space-y-0.5">
            <div className="font-medium">{(slide.data as any).title}</div>
            <div className="text-sm text-gray-600">{(slide.data as any).author}</div>
            {(slide.data as any).translator && (
              <div className="text-xs text-gray-600">Çevirmen: {(slide.data as any).translator}</div>
            )}
            <div className="text-xs text-gray-600">
              {(slide.data as any).pages ? `${(slide.data as any).pages} sayfa` : null}
              {(slide.data as any).isbn ? ` • ISBN: ${(slide.data as any).isbn}` : null}
            </div>
            {(slide.data as any).note && <div className="text-xs text-gray-700">{(slide.data as any).note}</div>}
          </div>
        </div>
      )}
    </div>
  )
}






