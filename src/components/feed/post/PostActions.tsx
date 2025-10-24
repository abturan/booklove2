// src/components/feed/post/PostActions.tsx
'use client'

import * as React from 'react'

export default function PostActions({
  liked,
  likeCount,
  commentCount = 0,
  onToggleLike,
  onShowLikers,
  onToggleComments,
  canInteract,
}: {
  liked: boolean
  likeCount: number
  commentCount?: number
  onToggleLike: () => void
  onShowLikers: () => void
  onToggleComments: () => void
  canInteract: boolean
}) {
  const begeniYazi = likeCount === 1 ? '1 beğeni' : `${likeCount} beğeni`
  const yorumYazi = commentCount === 1 ? '1 yorum' : `${commentCount} yorum`

  return (
    <div className="mt-3 flex items-center gap-8 text-sm text-gray-700">
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={canInteract ? onToggleLike : undefined}
          disabled={!canInteract}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${liked ? 'text-rose-600' : ''}`}
          aria-label={liked ? 'Beğeniyi geri al' : 'Beğen'}
          title={liked ? 'Beğeniyi geri al' : 'Beğen'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={onShowLikers}
          className="min-w-[1.5ch] hover:underline"
          aria-label="Beğenenleri göster"
          title="Beğenenleri göster"
        >
          {begeniYazi}
        </button>
      </div>

      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleComments}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-50"
          aria-label="Yorumları aç/kapat"
          title="Yorumlar"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={onToggleComments}
          className="min-w-[1.5ch] hover:underline"
          aria-label="Yorumları aç/kapat"
          title="Yorumlar"
        >
          {yorumYazi}
        </button>
      </div>
    </div>
  )
}
