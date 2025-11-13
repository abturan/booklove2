// src/components/feed/post/hooks/useComments.ts
import { useState } from 'react'
export function useComments(postId: string) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [likingId, setLikingId] = useState<string | null>(null)
  async function load() {
    setLoading(true)
    try {
      const r = await fetch(`/api/posts/${postId}/comments?limit=50`, { cache: 'no-store' })
      const j = await r.json()
      if (r.ok) setItems(j.items || [])
    } catch {}
    setLoading(false)
  }
  async function send() {
    const body = text.trim()
    if (!body) return
    const r = await fetch(`/api/posts/${postId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) })
    if (r.ok) { setText(''); await load() }
  }
  async function toggleLike(commentId: string) {
    if (!commentId) return
    setLikingId(commentId)
    try {
      const r = await fetch(`/api/comments/${commentId}/like`, { method: 'POST' })
      const j = await r.json().catch(() => null)
      if (r.ok) {
        setItems((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, likes: j?.count ?? 0, likedByMe: !!j?.liked } : c
          )
        )
      }
    } catch {}
    setLikingId((current) => (current === commentId ? null : current))
  }
  return { open, setOpen, items, text, setText, loading, load, send, toggleLike, likingId }
}
