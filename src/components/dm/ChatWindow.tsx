// src/components/dm/ChatWindow.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import MessageInput from './MessageInput'

type Msg = { id: string; authorId: string; body: string; createdAt: string }

export default function ChatWindow({ meId, peerId }: { meId: string; peerId: string }) {
  const [items, setItems] = useState<Msg[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const topRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetch('/api/dm/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ peerId }) })
  }, [peerId])

  async function load(first = false) {
    if (loading || (!hasMore && !first)) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('peerId', peerId)
      if (cursor && !first) params.set('cursor', cursor)
      const res = await fetch(`/api/dm/history?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Hata')
      const j = await res.json()
      const rows: Msg[] = Array.isArray(j.items) ? j.items : []
      setItems((prev) => first ? rows : [...rows, ...prev])
      if (j.nextCursor) setCursor(j.nextCursor); else setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setItems([]); setCursor(null); setHasMore(true); setLoading(false)
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId])

  useEffect(() => {
    const el = topRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) load()
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topRef.current, cursor, hasMore, loading])

  function onSent(m: Msg) {
    setItems((prev) => [...prev, m])
  }

  return (
    <div className="flex flex-col h-[70vh]">
      <div className="flex-1 overflow-auto px-4 py-3 space-y-2">
        <div ref={topRef} />
        {items.map((m) => (
          <div key={m.id} className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${m.authorId === meId ? 'ml-auto bg-gray-900 text-white' : 'mr-auto bg-gray-100 text-gray-900'}`}>
            <div>{m.body}</div>
            <div className="mt-1 text-[10px] opacity-60">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
        {!items.length && <div className="text-sm text-gray-600">Henüz mesaj yok.</div>}
      </div>
      <div className="border-t p-3">
        <MessageInput peerId={peerId} onSent={onSent} />
      </div>
    </div>
  )
}
