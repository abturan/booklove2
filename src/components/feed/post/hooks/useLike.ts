// src/components/feed/post/hooks/useLike.ts
import { useEffect, useState } from 'react'
export function useLike(postId: string, initial: number, can: boolean) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initial)
  useEffect(() => setCount(initial), [initial])
  async function toggle() {
    if (!can) return
    try {
      const res = await fetch(`/api/posts/${postId}/likes`, { method: 'POST' })
      const j = await res.json()
      if (!res.ok) return
      if (j.liked) {
        setLiked(true); setCount((c) => c + 1)
      } else {
        setLiked(false); setCount((c) => Math.max(0, c - 1))
      }
    } catch {}
  }
  return { liked, count, toggle }
}
