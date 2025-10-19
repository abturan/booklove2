// src/components/NotificationBadge.tsx
'use client'

import usePendingInvites from '@/lib/hooks/usePendingInvites'
import clsx from 'clsx'

export default function NotificationBadge({ placement = '' }: { placement?: string }) {
  const { count } = usePendingInvites()
  if (!count) return null
  return (
    <span
      className={clsx(
        'inline-flex min-w-[18px] h-[18px] text-[11px] px-1 rounded-full bg-rose-600 text-white items-center justify-center',
        placement
      )}
      aria-label={`${count} bekleyen istek`}
      title={`${count} bekleyen istek`}
    >
      {count}
    </span>
  )
}
