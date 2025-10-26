// src/components/friends/panel/HeaderBar.tsx
'use client'

import Link from 'next/link'

export default function HeaderBar({
  totalCount,
}: {
  totalCount: number
  compact: boolean
  onToggleCompact: () => void
}) {
  const showBadge = totalCount > 0
  const countLabel = totalCount > 99 ? '99+' : String(totalCount)

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="text-2xl font-extrabold tracking-tight">Book Buddy</div>
        {showBadge && (
          <Link
            href="/friends"
            className="hidden lg:inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary text-xs font-bold"
            aria-label={`${countLabel} bildirim (istek + okunmamış)`}
            title="Bildirimler (istek + okunmamış)"
          >
            {countLabel}
          </Link>
        )}
      </div>
      <div className="h-12 w-12" />
    </div>
  )
}
