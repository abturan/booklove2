// src/components/feed/LikeButton.tsx
'use client'

import { useState } from 'react'

export default function LikeButton({ postId, initialCount }: { postId: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    if (busy) return
    setBusy(true)
    const res = await fetch(`/api/posts/${postId}/likes`, { method: 'POST' })
    const j = await res.json().catch(() => null)
    setBusy(false)
    if (!res.ok) return
    setCount((c) => (j?.liked ? c + 1 : c - 1))
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="px-3 py-1.5 rounded-full border text-sm disabled:opacity-60"
    >
      ❤️ {count}
    </button>
  )
}
