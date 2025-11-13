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
  onRebook,
  onEdit,
  onDelete,
  onReport,
  canInteract,
  isOwner,
}: {
  liked: boolean
  likeCount: number
  commentCount?: number
  onToggleLike: () => void
  onShowLikers: () => void
  onToggleComments: () => void
  onRebook: () => void
  onEdit: () => void
  onDelete: () => void
  onReport: () => void
  canInteract: boolean
  isOwner: boolean
}) {
  const begeniYazi = likeCount === 1 ? '1 beğeni' : `${likeCount} beğeni`
  const yorumYazi = commentCount === 1 ? '1 yorum' : `${commentCount} yorum`
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Raise parent card above others while menu is open
  React.useEffect(() => {
    const root = menuRef.current?.closest('.card') as HTMLElement | null
    if (!root) return
    if (menuOpen) {
      // Remember previous position to restore later
      const prevPos = root.style.position
      const prevZ = root.style.zIndex
      ;(root as any)._prevPos = prevPos
      ;(root as any)._prevZ = prevZ
      root.style.position = prevPos || 'relative'
      root.style.zIndex = '60'
    } else {
      const prevPos = (root as any)._prevPos as string | undefined
      const prevZ = (root as any)._prevZ as string | undefined
      if (prevPos !== undefined) root.style.position = prevPos
      if (prevZ !== undefined) root.style.zIndex = prevZ
    }
    return () => {
      if (!root) return
      const prevPos = (root as any)._prevPos as string | undefined
      const prevZ = (root as any)._prevZ as string | undefined
      if (prevPos !== undefined) root.style.position = prevPos
      if (prevZ !== undefined) root.style.zIndex = prevZ
    }
  }, [menuOpen])

  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-700">
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={canInteract ? onToggleLike : undefined}
          disabled={!canInteract}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${liked ? 'text-rose-600' : ''}`}
          aria-label={liked ? 'Beğeniyi geri al' : 'Beğen'}
          title={!canInteract ? 'Önce e‑postanızı doğrulayın' : (liked ? 'Beğeniyi geri al' : 'Beğen')}
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
          title={canInteract ? 'Yorumlar' : 'Önce e‑postanızı doğrulayın'}
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

      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={canInteract ? onRebook : undefined}
          disabled={!canInteract}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Rebookie paylaş"
          title={!canInteract ? 'Önce e‑postanızı doğrulayın' : 'Rebookie paylaş'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M7 7h10l-3-3m3 3l-3 3" />
            <path d="M17 17H7l3 3m-3-3l3-3" />
          </svg>
        </button>
      </div>

      <div className="relative inline-flex items-center gap-2 ml-auto" ref={menuRef}>
        <button
          type="button"
          onClick={canInteract ? () => setMenuOpen(v => !v) : undefined}
          disabled={!canInteract}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50`}
          aria-label="Daha fazla seçenek"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title={!canInteract ? 'Önce e‑postanızı doğrulayın' : 'Seçenekler'}
        >
          {/* Kebab menu icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <circle cx="19" cy="12" r="1.7" />
          </svg>
        </button>
        {menuOpen && (
          <div role="menu" className="absolute right-0 top-9 z-50 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            {/* Düzenle (sadece sahibi) */}
            {isOwner && (
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); onEdit() }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5l4 4L7 21H3v-4z"/>
                </svg>
                <span>Düzenle</span>
              </button>
            )}
            {/* Sil (sadece sahibi) */}
            {isOwner && (
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); onDelete() }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 6h18"/>
                  <path d="M8 6V4h8v2"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
                <span>Sil</span>
              </button>
            )}
            {/* Bildir (sahibi değilse) */}
            {!isOwner && (
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); onReport() }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M4 4h10l-2 4 2 4H4v6"/>
                  <circle cx="4" cy="20" r="1" />
                </svg>
                <span>Bildir</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
