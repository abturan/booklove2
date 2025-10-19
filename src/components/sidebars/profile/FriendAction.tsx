// src/components/sidebars/profile/FriendAction.tsx
'use client'

import Link from 'next/link'
import RequestButton from '@/components/friends/RequestButton'

export default function FriendAction({
  mode,
  userId,
}: {
  mode: 'none' | 'message' | 'sent' | 'pending' | 'canSend'
  userId: string
}) {
  if (mode === 'none') return null
  if (mode === 'message') {
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
        İstek gönderildi
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
  return <RequestButton toUserId={userId} initialState="idle" />
}
