// src/components/messages/ChatWindow.tsx
'use client'

import * as React from 'react'
import Avatar from '@/components/Avatar'

type Peer = { id: string; name: string | null; username: string | null; avatarUrl: string | null }
type Msg = { id: string; body: string; createdAt: string; authorId: string }

export default function ChatWindow({ peerId }: { peerId: string }) {
  const [threadId, setThreadId] = React.useState<string | null>(null)
  const [peer, setPeer] = React.useState<Peer | null>(null)
  const [items, setItems] = React.useState<Msg[]>([])
  const [text, setText] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const bottomRef = React.useRef<HTMLDivElement | null>(null)

  async function open() {
    const res = await fetch(`/api/dm/open?peerId=${encodeURIComponent(peerId)}`, { cache: 'no-store' })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Hata')
    setThreadId(j.threadId)
    setPeer(j.peer)
    setItems(j.messages || [])
    window.dispatchEvent(new CustomEvent('dm:changed'))
  }

  React.useEffect(() => {
    open()
  }, [peerId])

  React.useEffect(() => {
    if (!threadId) return
    const es = new EventSource(`/api/dm/stream?threadId=${encodeURIComponent(threadId)}`)
    es.onmessage = (ev) => {
      const msg: Msg = JSON.parse(ev.data)
      setItems((prev) => [...prev, msg])
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    return () => es.close()
  }, [threadId])

  async function send() {
    if (!threadId || !text.trim() || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/dm/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ threadId, body: text }),
      })
      const j = await res.json()
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Hata')
      setText('')
    } finally {
      setBusy(false)
    }
  }

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items.length])

  return (
    <div className="card p-0 overflow-hidden">
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <Avatar src={peer?.avatarUrl ?? null} size={36} alt={peer?.name || 'Kullanıcı'} />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{peer?.name || 'Kullanıcı'}</div>
          <div className="text-xs text-gray-600 truncate">{peer?.username ? `@${peer.username}` : ''}</div>
        </div>
      </div>

      <div className="p-4 space-y-2 max-h-[60vh] overflow-auto">
        {items.map((m) => (
          <div key={m.id} className={`flex ${m.authorId === peerId ? 'justify-start' : 'justify-end'}`}>
            <div className={`px-3 py-2 rounded-2xl ${m.authorId === peerId ? 'bg-gray-100 text-gray-900' : 'bg-gray-900 text-white'}`}>
              <div className="text-sm">{m.body}</div>
              <div className="text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Mesaj yazın…"
          className="flex-1 rounded-full border px-3 py-2 text-sm"
        />
        <button
          onClick={send}
          disabled={!text.trim() || busy || !threadId}
          className="px-3 py-2 rounded-full bg-gray-900 text-white text-sm disabled:opacity-60"
        >
          Gönder
        </button>
      </div>
    </div>
  )
}
