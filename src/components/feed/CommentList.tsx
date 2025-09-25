// src/components/feed/CommentList.tsx
'use client'

import { useEffect, useState } from 'react'

type Comment = {
  id: string
  body: string
  createdAt: string
  user: { id: string; name: string | null; username: string | null; avatarUrl: string | null }
}

export default function CommentList({ postId }: { postId: string }) {
  const [items, setItems] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const res = await fetch(`/api/posts/${postId}/comments?limit=50`, { cache: 'no-store' })
    const j = await res.json()
    setItems(j.items || [])
  }

  useEffect(() => { load() }, [])

  async function add() {
    if (!body.trim()) return
    setBusy(true)
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: body.trim() })
    })
    setBusy(false)
    if (res.ok) {
      setBody('')
      load()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Yorum yaz…"
          className="flex-1 border rounded-lg px-3 h-9"
        />
        <button onClick={add} disabled={busy} className="px-3 rounded-lg bg-gray-900 text-white text-sm">
          Gönder
        </button>
      </div>

      <div className="space-y-2">
        {items.map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            <img
              src={c.user.avatarUrl || `https://api.dicebear.com/8.x/thumbs/png?seed=${encodeURIComponent(c.user.id)}`}
              alt=""
              className="w-8 h-8 rounded-full object-cover mt-0.5"
            />
            <div className="bg-gray-50 border rounded-lg px-3 py-2 flex-1">
              <div className="text-sm">
                <span className="font-medium">{c.user.name}</span>{' '}
                <span className="text-gray-500">@{c.user.username}</span>
              </div>
              <div className="text-sm whitespace-pre-wrap">{c.body}</div>
              <div className="text-xs text-gray-500 mt-1">{new Date(c.createdAt).toLocaleString('tr-TR')}</div>
            </div>
          </div>
        ))}
        {!items.length && <div className="text-sm text-gray-500">Henüz yorum yok.</div>}
      </div>
    </div>
  )
}
