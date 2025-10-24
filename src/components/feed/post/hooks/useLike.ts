// src/components/feed/post/hooks/useLike.ts
import { useEffect, useState } from 'react'

type LikesState = { liked: boolean; count: number }

export function useLike(postId: string, initialCount: number, can: boolean) {
  const [state, setState] = useState<LikesState>({ liked: false, count: initialCount })

  useEffect(() => {
    setState((s) => ({ ...s, count: initialCount }))
  }, [initialCount])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/posts/${postId}/likes`, { cache: 'no-store' })
        const j = await res.json().catch(() => null)
        if (!cancelled && res.ok && j) {
          setState({ liked: !!j.liked, count: Number(j.count ?? initialCount ?? 0) })
        }
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [postId])

  async function toggle() {
    if (!can) return
    try {
      const res = await fetch(`/api/posts/${postId}/likes`, { method: 'POST' })
      const j = await res.json().catch(() => null)
      if (!res.ok) return
      if (j?.liked) {
        setState((s) => ({ liked: true, count: s.count + 1 }))
      } else {
        setState((s) => ({ liked: false, count: Math.max(0, s.count - 1) }))
      }
    } catch {}
  }

  return { liked: state.liked, count: state.count, toggle }
}
