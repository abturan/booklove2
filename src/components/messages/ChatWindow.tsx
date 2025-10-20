// src/components/messages/ChatWindow.tsx
'use client'

import * as React from 'react'
import Avatar from '@/components/Avatar'

type Peer = { id: string; name: string | null; username: string | null; avatarUrl: string | null }
type Msg = { id: string; body: string; createdAt: string; authorId: string }

export default function ChatWindow({ peerId, threadId }: { peerId?: string; threadId?: string }) {
  const [curThreadId, setCurThreadId] = React.useState<string | null>(threadId || null)
  const [peer, setPeer] = React.useState<Peer | null>(null)
  const [items, setItems] = React.useState<Msg[]>([])
  const [text, setText] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const listRef = React.useRef<HTMLDivElement | null>(null)

  async function openByPeer(id: string) {
    setError(null)
    const res = await fetch(`/api/dm/open?peerId=${encodeURIComponent(id)}`, { cache: 'no-store' })
    const ct = res.headers.get('content-type') || ''
    const data = ct.includes('application/json') ? await res.json().catch(() => null) : null
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
    if (!data?.threadId || !data?.peer) throw new Error('Geçersiz yanıt')
    setCurThreadId(data.threadId)
    setPeer(data.peer)
    setItems(Array.isArray(data.messages) ? data.messages : [])
    window.dispatchEvent(new CustomEvent('dm:changed'))
  }

  async function openByThread(id: string) {
    setError(null)
    const res = await fetch(`/api/dm/thread?threadId=${encodeURIComponent(id)}`, { cache: 'no-store' })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
    if (!data?.threadId || !data?.peer) throw new Error('Geçersiz yanıt')
    setCurThreadId(data.threadId)
    setPeer(data.peer)
    setItems(Array.isArray(data.messages) ? data.messages : [])
  }

  React.useEffect(() => {
    if (threadId) openByThread(threadId).catch((e: any) => setError(e?.message || 'Sohbet açılamadı'))
  }, [threadId])

  React.useEffect(() => {
    if (peerId && !threadId) openByPeer(peerId).catch((e: any) => setError(e?.message || 'Sohbet açılamadı'))
  }, [peerId, threadId])

  React.useEffect(() => {
    if (!curThreadId) return
    const es = new EventSource(`/api/dm/stream?threadId=${encodeURIComponent(curThreadId)}`)
    es.onmessage = (ev) => {
      const msg: Msg = JSON.parse(ev.data)
      setItems((prev) => [...prev, msg])
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    }
    return () => es.close()
  }, [curThreadId])

  async function send() {
    if (!curThreadId || !text.trim() || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/dm/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ threadId: curThreadId, body: text }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Hata')
      setText('')
    } catch (e: any) {
      setError(e?.message || 'Mesaj gönderilemedi')
    } finally {
      setBusy(false)
    }
  }

  React.useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [items.length])

  const otherId = peer?.id || peerId || ''

  return (
    <div className="card p-0 overflow-hidden">
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <Avatar src={peer?.avatarUrl ?? null} size={36} alt={peer?.name || 'Kullanıcı'} />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{peer?.name || 'Kullanıcı'}</div>
          <div className="text-xs text-gray-600 truncate">{peer?.username ? `@${peer.username}` : ''}</div>
        </div>
      </div>

      {error && (
        <div className="px-4 pt-3">
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
        </div>
      )}

      <div ref={listRef} className="p-4 space-y-2 max-h-[60vh] overflow-auto overscroll-contain">
        {items.map((m) => (
          <div key={m.id} className={`flex ${m.authorId === otherId ? 'justify-start' : 'justify-end'}`}>
            <div className={`px-3 py-2 rounded-2xl ${m.authorId === otherId ? 'bg-gray-100 text-gray-900' : 'bg-gray-900 text-white'}`}>
              <div className="text-sm">{m.body}</div>
              <div className="text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
            </div>
          </div>
        ))}
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
          disabled={!text.trim() || busy || !curThreadId}
          className="px-3 py-2 rounded-full bg-gray-900 text-white text-sm disabled:opacity-60"
        >
          Gönder
        </button>
      </div>
    </div>
  )
}






