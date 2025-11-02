// src/components/NotificationBadge.tsx
'use client'

import usePendingInvites from '@/lib/hooks/usePendingInvites'
import clsx from 'clsx'

export default function NotificationBadge({
  placement = 'absolute top-0 right-0 -translate-x-1/4 translate-y-1/4',
}: {
  placement?: string
}) {
  const { count } = usePendingInvites()
  if (!count) return null
  return (
    <span
      className={clsx('inline-block h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_2px_white]', placement)}
      aria-label={`Bekleyen isteğin var`}
      title={`Bekleyen isteğin var`}
    />
  )
}
