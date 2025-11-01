// src/components/friends/panel/HeaderBar.tsx
'use client'

import Link from 'next/link'

export default function HeaderBar({
  badgeCount,
}: {
  badgeCount?: number
  compact: boolean
  onToggleCompact: () => void
}) {
  const showBadge = typeof badgeCount === 'number'
  const countLabel = showBadge ? (badgeCount! > 99 ? '99+' : String(badgeCount)) : null

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="text-2xl font-extrabold tracking-tight">Book Buddy</div>
        {showBadge && countLabel && (
          <Link
            href="/friends"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary text-xs font-bold"
            aria-label={`${countLabel} takipçi`}
            title="Takipçi sayısı"
          >
            {countLabel}
          </Link>
        )}
      </div>
      <div className="h-12 w-12" />
    </div>
  )
}
