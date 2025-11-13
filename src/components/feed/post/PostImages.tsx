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

export default function PostImages({ images, enableLightbox = true }: { images: PostImage[]; enableLightbox?: boolean }) {
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
        {normalized.map((img, i) => {
          const interactive = enableLightbox
          const commonClasses = clsx(
            'group relative aspect-square w-full max-h-[420px] overflow-hidden rounded-2xl',
            interactive ? 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer' : 'pointer-events-none'
          )
          return (
            <button
              type="button"
              key={i}
              onClick={interactive ? () => setActiveIndex(i) : undefined}
              className={commonClasses}
              tabIndex={interactive ? 0 : -1}
              aria-disabled={!interactive}
            >
              <img
                src={img.url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              />
            </button>
          )
        })}
      </div>

      <BareModal
        open={activeIndex !== null}
        onClose={() => setActiveIndex(null)}
        title={null}
        size="xl"
        className="bg-black text-white rounded-none w-screen h-screen max-h-none"
        contentClassName="p-0 h-full flex items-center justify-center"
        scrollable={false}
      >
        {currentImage && (
          <div className="relative flex h-full w-full items-center justify-center bg-black">
            {currentImage.link && (
              <a
                href={currentImage.link}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm text-white backdrop-blur hover:bg-white/20"
              >
                Bağlantıyı aç
              </a>
            )}
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (activeIndex !== null) showAt(activeIndex - 1)
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white shadow hover:bg-black/60"
                  aria-label="Önceki görsel"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeIndex !== null) showAt(activeIndex + 1)
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white shadow hover:bg-black/60"
                  aria-label="Sonraki görsel"
                >
                  ›
                </button>
              </>
            )}
            <img
              src={currentImage.url}
              alt=""
              className="max-h-full max-w-full select-none object-contain"
            />
            {hasMultiple && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                {normalized.map((_, dotIdx) => (
                  <span
                    key={dotIdx}
                    className={clsx(
                      'h-1.5 w-4 rounded-full transition-colors',
                      dotIdx === activeIndex ? 'bg-white' : 'bg-white/30'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </BareModal>
    </>
  )
}
