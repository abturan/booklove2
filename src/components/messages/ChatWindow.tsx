// src/components/messages/ChatWindow.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

type Peer = { id: string; name: string | null; username: string | null; slug: string | null; avatarUrl: string | null }
type Message = { id: string; authorId: string; body: string; createdAt: string }
type Loaded =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; peer: Peer; messages: Message[] }
  | { status: 'error' }

export default function ChatWindow({ threadId }: { threadId: string }) {
  const [state, setState] = React.useState<Loaded>({ status: 'idle' })
  const [busy, setBusy] = React.useState(false)
  const [body, setBody] = React.useState('')

  async function load() {
    setState({ status: 'loading' })
    try {
      const res = await fetch(`/api/dm/thread?threadId=${encodeURIComponent(threadId)}`, { cache: 'no-store' })
      const j = await res.json()
      if (res.ok) {
        setState({ status: 'loaded', peer: j.peer, messages: j.messages || [] })
      } else {
        setState({ status: 'error' })
      }
    } catch {
      setState({ status: 'error' })
    }
  }

  React.useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('dm:changed', h)
    return () => window.removeEventListener('dm:changed', h)
  }, [threadId])

  async function send() {
    const text = body.trim()
    if (!text || busy || state.status !== 'loaded') return
    setBusy(true)
    try {
      const res = await fetch('/api/dm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, body: text }),
      })
      const j = await res.json().catch(() => null)
      if (res.ok && j?.ok) {
        setBody('')
        window.dispatchEvent(new CustomEvent('dm:changed'))
        await load()
      }
    } finally {
      setBusy(false)
    }
  }

  if (state.status === 'idle' || state.status === 'loading') {
    return <div className="card p-6 text-sm text-gray-600">Yükleniyor…</div>
  }
  if (state.status === 'error') {
    return <div className="card p-6 text-sm text-red-600">Sohbet yüklenemedi.</div>
  }

  const { peer, messages } = state

  return (
    <div className="card p-0 overflow-hidden flex flex-col min-h-[60vh]">
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <button
          type="button"
          onClick={() => history.back()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="Geri"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </button>

        <Link
          href={userPath(peer?.username ?? undefined, peer?.name ?? undefined, peer?.slug ?? undefined)}
          className="flex items-center gap-3 min-w-0"
        >
          <Avatar src={peer?.avatarUrl ?? null} size={36} alt={peer?.name || 'Kullanıcı'} />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{peer?.name || 'Kullanıcı'}</div>
            <div className="text-xs text-gray-600 truncate">{peer?.username ? `@${peer.username}` : ''}</div>
          </div>
        </Link>

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => {
              const el = document.querySelector<HTMLInputElement>('#dm-input')
              el?.focus()
            }}
            className="inline-flex h-9 px-3 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-medium"
          >
            Yaz
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-4 space-y-3 bg-white">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-600">Henüz mesaj yok.</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[70%] rounded-2xl bg-gray-900 text-white px-3 py-2 text-sm">
                <div>{m.body}</div>
                <div className="text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t px-3 py-3 bg-white">
        <div className="flex items-center gap-2">
          <input
            id="dm-input"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Mesaj yazın…"
            className="flex-1 rounded-full border px-4 py-2 outline-none focus:ring-2 focus:ring-gray-900"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || !body.trim()}
            className="inline-flex h-10 px-4 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold disabled:opacity-50"
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  )
}






