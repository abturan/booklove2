// src/components/feed/post/hooks/useComments.ts
import { useState } from 'react'
export function useComments(postId: string) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
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
  return { open, setOpen, items, text, setText, loading, load, send }
}
