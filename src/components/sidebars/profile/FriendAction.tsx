// src/components/sidebars/profile/FriendAction.tsx
'use client'

import Link from 'next/link'
import RequestButton from '@/components/friends/RequestButton'

type Appearance = 'default' | 'compact'

export default function FriendAction({
  mode,
  userId,
  appearance = 'default',
}: {
  mode: 'none' | 'message' | 'sent' | 'pending' | 'canSend'
  userId: string
  appearance?: Appearance
}) {
  if (mode === 'none') return null
  if (mode === 'message') {
    if (appearance === 'compact') {
      return (
        <Link
          href={`/messages/${userId}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow hover:bg-primary/90"
          aria-label="Mesaj gönder"
          title="Mesaj gönder"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 5h16v11H8l-4 4z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )
    }
    return (
      <Link
        href={`/messages/${userId}`}
        className="px-3 py-1.5 rounded-full bg-primary text-white text-sm"
      >
        Mesaj gönder
      </Link>
    )
  }
  if (mode === 'sent') {
    return (
      <span className="px-3 py-1.5 rounded-full bg-gray-200 text-gray-700 text-sm">
        Beklemede
      </span>
    )
  }
  if (mode === 'pending') {
    return (
      <span className="px-3 py-1.5 rounded-full bg-gray-200 text-gray-700 text-sm">
        Size istek gönderdi
      </span>
    )
  }
  const className =
    appearance === 'compact'
      ? 'px-3 py-1.5 rounded-full bg-primary text-white text-sm disabled:opacity-60'
      : undefined
  return <RequestButton toUserId={userId} initialState="idle" className={className} />
}
