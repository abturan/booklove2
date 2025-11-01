// src/components/sidebars/profile/FriendAction.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Appearance = 'default' | 'compact'

export default function FriendAction({
  mode,
  userId,
  appearance = 'default',
  refreshOnChange = true,
  allowUnfollow = true,
  showMessageButton = true,
}: {
  mode: 'none' | 'message' | 'follow' | 'following' | 'followBack'
  userId: string
  appearance?: Appearance
  refreshOnChange?: boolean
  allowUnfollow?: boolean
  showMessageButton?: boolean
}) {
  const [state, setState] = useState(mode)
  const [busy, setBusy] = useState(false)
  const [chatBusy, setChatBusy] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setState(mode)
  }, [mode])

  if (mode === 'none') return null

  const followLabel = 'Takip et'

  async function follow() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ toUserId: userId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Hata')
      if (data.status === 'MUTUAL') {
        setState('message')
      } else {
        setState('following')
      }
      window.dispatchEvent(new CustomEvent('friends:changed'))
      if (refreshOnChange) router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  async function unfollow() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ toUserId: userId, action: 'unfollow' }),
      })
      if (!res.ok) throw new Error('Hata')
      setState('follow')
      window.dispatchEvent(new CustomEvent('friends:changed'))
      window.dispatchEvent(new CustomEvent('friends:unfollowed', { detail: { userId } }))
      if (refreshOnChange) router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  async function openThread() {
    if (chatBusy) return
    setChatBusy(true)
    try {
      const res = await fetch(`/api/dm/open?peerId=${encodeURIComponent(userId)}`, { cache: 'no-store' })
      const j = await res.json().catch(() => null)
      if (res.ok && j?.threadId) {
        router.push(`/messages/${j.threadId}`)
        router.refresh()
        window.dispatchEvent(new CustomEvent('dm:changed'))
      }
    } finally {
      setChatBusy(false)
    }
  }

  if (state === 'following') {
    if (appearance === 'compact') {
      if (allowUnfollow) {
        return (
          <button
            type="button"
            onClick={unfollow}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-700 text-sm hover:bg-gray-300 disabled:opacity-60"
            aria-label="Takibi bırak"
            title="Takibi bırak"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6 18 18M6 18 18 6" />
            </svg>
          </button>
        )
      }
      return (
        <span className="inline-flex h-9 items-center rounded-full bg-gray-100 px-3 text-xs font-semibold text-gray-600">
          Takiptesin
        </span>
      )
    }
    return (
      <span className="relative inline-flex items-center rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-700">
        Takiptesin
        {allowUnfollow && (
          <button
            type="button"
            onClick={unfollow}
            disabled={busy}
            className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-semibold text-gray-500 shadow hover:bg-gray-200 disabled:opacity-60"
            aria-label="Takibi bırak"
          >
            ✕
          </button>
        )}
      </span>
    )
  }

  if (state === 'followBack' || state === 'follow') {
    const className =
      appearance === 'compact'
        ? 'px-3 py-1.5 rounded-full bg-primary text-white text-sm disabled:opacity-60'
        : 'px-3 py-1.5 rounded-full bg-primary text-white text-sm disabled:opacity-60'
    return (
      <button type="button" onClick={follow} disabled={busy} className={className}>
        {followLabel}
      </button>
    )
  }

  if (state === 'message') {
    if (!showMessageButton) {
      return (
        <span className="relative inline-flex items-center rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-700">
          Takiptesin
          {allowUnfollow && (
            <button
              type="button"
              onClick={unfollow}
              disabled={busy}
              className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-semibold text-gray-500 shadow hover:bg-gray-200 disabled:opacity-60"
              aria-label="Takibi bırak"
            >
              ✕
            </button>
          )}
        </span>
      )
    }

    if (appearance === 'compact') {
      return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <button
            type="button"
            onClick={openThread}
            disabled={chatBusy}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow hover:bg-primary/90 disabled:opacity-60"
            aria-label="Mesaj gönder"
            title="Mesaj gönder"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 5h16v11H8l-4 4z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {allowUnfollow && (
            <button
              type="button"
              onClick={unfollow}
              disabled={busy}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-700 text-sm hover:bg-gray-300 disabled:opacity-60"
              aria-label="Takibi bırak"
              title="Takibi bırak"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6 18 18M6 18 18 6" />
              </svg>
            </button>
          )}
        </div>
      )
    }
    return (
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <span className="relative inline-flex items-center rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-700">
          Takiptesin
          {allowUnfollow && (
            <button
              type="button"
              onClick={unfollow}
              disabled={busy}
              className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-semibold text-gray-500 shadow hover:bg-gray-200 disabled:opacity-60"
              aria-label="Takibi bırak"
            >
              ✕
            </button>
          )}
        </span>
        <button
          type="button"
          onClick={openThread}
          disabled={chatBusy}
          aria-label="Mesaj gönder"
          className="self-end inline-flex items-center justify-center rounded-full bg-primary px-3 py-1.5 text-sm text-white disabled:opacity-60 sm:self-auto"
        >
          <svg
            className="sm:mr-2"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M4 5h16v11H8l-4 4z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">{chatBusy ? 'Açılıyor…' : 'Mesaj gönder'}</span>
        </button>
      </div>
    )
  }

  return null
}
