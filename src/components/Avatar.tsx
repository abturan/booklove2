// src/components/Avatar.tsx
'use client'

import Image from 'next/image'
import clsx from 'clsx'
import { useMemo, useState } from 'react'

type Props = {
  src?: string | null
  size?: number
  alt?: string
  className?: string
  seed?: string
}

export default function Avatar({ src, size = 36, alt = 'Avatar', className, seed }: Props) {
  const fallbackSeed = (seed || alt || 'user').toString()
  const fallbackUrl = useMemo(
    () => `https://api.dicebear.com/8.x/thumbs/png?seed=${encodeURIComponent(fallbackSeed)}`,
    [fallbackSeed]
  )
  const [broken, setBroken] = useState(false)
  const [usedFallback, setUsedFallback] = useState(!src)

  const showInitials = broken && usedFallback
  const initials = (alt || 'U').trim().charAt(0).toUpperCase()

  return (
    <div
      className={clsx('relative inline-block rounded-full overflow-hidden ring-1 ring-black/5 bg-gray-100', className)}
      style={{ width: size, height: size }}
      aria-label={alt}
    >
      {!showInitials ? (
        <Image
          src={usedFallback ? fallbackUrl : (src as string)}
          alt={alt || 'Avatar'}
          fill
          className="object-cover"
          sizes={`${size}px`}
          onError={() => {
            if (!usedFallback) {
              setUsedFallback(true)
            } else {
              setBroken(true)
            }
          }}
          unoptimized={!!src && (src as string).startsWith('/uploads/')}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700 text-sm font-semibold">
          {initials}
        </div>
      )}
    </div>
  )
}
