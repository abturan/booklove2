// src/components/feed/post/PostImages.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import BareModal from '@/components/ui/BareModal'
import clsx from 'clsx'

type PostImage = {
  url: string
  width?: number | null
  height?: number | null
  link?: string | null
}

export default function PostImages({ images }: { images: PostImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const normalized = useMemo(() => images?.filter((img) => img && img.url) ?? [], [images])
  if (!normalized || normalized.length === 0) return null

  const isSingle = normalized.length === 1
  const hasMultiple = normalized.length > 1

  function showAt(idx: number) {
    if (normalized.length === 0) return
    const safe = ((idx % normalized.length) + normalized.length) % normalized.length
    setActiveIndex(safe)
  }

  useEffect(() => {
    if (activeIndex === null || !hasMultiple) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        showAt(activeIndex + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        showAt(activeIndex - 1)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [activeIndex, hasMultiple, normalized.length])

  const currentImage = activeIndex !== null ? normalized[activeIndex] : null

  return (
    <>
      <div className={clsx('mt-2 grid gap-2', isSingle ? 'grid-cols-1' : 'grid-cols-2')}>
        {normalized.map((img, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setActiveIndex(i)}
            className="group relative aspect-square w-full max-h-[420px] overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <img
              src={img.url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      <BareModal open={activeIndex !== null} onClose={() => setActiveIndex(null)}>
        {currentImage && (
          <div className="space-y-4">
            {currentImage.link && (
              <a
                href={currentImage.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm text-primary hover:bg-primary/15"
              >
                Bağlantıyı aç
              </a>
            )}
            <div className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-2">
              {hasMultiple && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeIndex !== null) showAt(activeIndex - 1)
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-700 shadow hover:bg-white"
                    aria-label="Önceki görsel"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeIndex !== null) showAt(activeIndex + 1)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-700 shadow hover:bg-white"
                    aria-label="Sonraki görsel"
                  >
                    ›
                  </button>
                </>
              )}
              <img
                src={currentImage.url}
                alt=""
                className="mx-auto h-auto max-h-[65dvh] w-full select-none object-contain"
              />
              {hasMultiple && (
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                  {normalized.map((_, dotIdx) => (
                    <span
                      key={dotIdx}
                      className={clsx(
                        'h-1.5 w-1.5 rounded-full',
                        dotIdx === activeIndex ? 'bg-primary' : 'bg-gray-300'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </BareModal>
    </>
  )
}
