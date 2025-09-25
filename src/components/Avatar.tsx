// src/components/Avatar.tsx
'use client'

import Image from 'next/image'
import clsx from 'clsx'

type Props = {
  src?: string | null
  size?: number
  alt?: string
  className?: string
  /** Dicebear seed için; verilmezse alt kullanılır */
  seed?: string
}

export default function Avatar({ src, size = 36, alt = 'Avatar', className, seed }: Props) {
  const showReal = typeof src === 'string' && src.trim().length > 0
  const fallbackSeed = seed || alt || 'user'
  const fallback = `https://api.dicebear.com/8.x/thumbs/png?seed=${encodeURIComponent(fallbackSeed)}`

  return (
    <div
      className={clsx(
        'relative inline-block rounded-full overflow-hidden ring-1 ring-black/5 bg-gray-100',
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={alt}
    >
      <Image
        src={showReal ? (src as string) : fallback}
        alt={alt}
        fill
        className="object-cover"
        sizes={`${size}px`}
        unoptimized={showReal && (src as string).startsWith('/uploads/')}
      />
    </div>
  )
}
