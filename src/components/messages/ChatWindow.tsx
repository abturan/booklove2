// src/components/messages/ChatWindow.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

type Peer = { id: string; name: string | null; username: string | null; slug: string | null; avatarUrl: string | null }
type Message = { id: string; authorId: string; body: string; createdAt: string }

type LoadedState = {
  status: 'loaded'
  peer: Peer
  messages: Message[]
  threadStatus: 'ACTIVE' | 'REQUESTED' | 'ARCHIVED'
  relation: 'self' | 'mutual' | 'following' | 'follower' | 'none'
  canMessage: boolean
  requestedById: string | null
  requestedAt: string | null
}

type State = { status: 'idle' | 'loading' } | LoadedState

async function respondForThread(threadId: string, action: 'ACCEPT' | 'DECLINE') {
  const res = await fetch('/api/friends/respond', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ threadId, action }),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => null)
    throw new Error(j?.error || 'İşlem başarısız')
  }
  window.dispatchEvent(new CustomEvent('friends:changed'))
  window.dispatchEvent(new Event('dm:changed'))
}

export default function ChatWindow({ threadId }: { threadId: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const meId = (session?.user as any)?.id || null

  const [state, setState] = useState<State>({ status: 'idle' })
  const [busy, setBusy] = useState(false)
  const [body, setBody] = useState('')
  const [responding, setResponding] = useState<'ACCEPT' | 'DECLINE' | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setState({ status: 'loading' })
      try {
        const res = await fetch(`/api/dm/thread?threadId=${encodeURIComponent(threadId)}`, { cache: 'no-store' })
        const j = await res.json()
        if (!cancelled) {
          if (res.ok) {
            setState({
              status: 'loaded',
              peer: j.peer,
              messages: Array.isArray(j.messages) ? j.messages : [],
              threadStatus: j.status ?? 'ACTIVE',
              relation: j.relation ?? 'none',
              canMessage: Boolean(j.canMessage ?? true),
              requestedById: j.requestedById ?? null,
              requestedAt: j.requestedAt ?? null,
            })
          } else {
            setState({
              status: 'loaded',
              peer: j?.peer || { id: '', name: null, username: null, slug: null, avatarUrl: null },
              messages: [],
              threadStatus: 'ARCHIVED',
              relation: 'none',
              canMessage: false,
              requestedById: null,
              requestedAt: null,
            })
          }
        }
      } catch {
        if (!cancelled) {
          setState({
            status: 'loaded',
            peer: { id: '', name: null, username: null, slug: null, avatarUrl: null },
            messages: [],
            threadStatus: 'ARCHIVED',
            relation: 'none',
            canMessage: false,
            requestedById: null,
            requestedAt: null,
          })
        }
      }
    }

    load()
    const handleChange = () => load()
    window.addEventListener('dm:changed', handleChange)
    return () => {
      cancelled = true
      window.removeEventListener('dm:changed', handleChange)
    }
  }, [threadId])

  async function refresh() {
    try {
      const res = await fetch(`/api/dm/thread?threadId=${encodeURIComponent(threadId)}`, { cache: 'no-store' })
      const j = await res.json()
      if (res.ok) {
        setState({
          status: 'loaded',
          peer: j.peer,
          messages: Array.isArray(j.messages) ? j.messages : [],
          threadStatus: j.status ?? 'ACTIVE',
          relation: j.relation ?? 'none',
          canMessage: Boolean(j.canMessage ?? true),
          requestedById: j.requestedById ?? null,
          requestedAt: j.requestedAt ?? null,
        })
      }
    } catch {}
  }

  async function send() {
    if (state.status !== 'loaded' || !state.canMessage) return
    const text = body.trim()
    if (!text || busy) return
    setBusy(true)
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      authorId: meId || 'me',
      body: text,
      createdAt: new Date().toISOString(),
    }
    setState({
      ...state,
      messages: [...state.messages, optimistic],
    })
    setBody('')
    try {
      const res = await fetch('/api/dm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, body: text }),
      })
      const j = await res.json().catch(() => null)
      if (res.ok && j?.ok) {
        window.dispatchEvent(new Event('dm:counts'))
        await refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  const handleRespond = async (action: 'ACCEPT' | 'DECLINE') => {
    if (responding) return
    setResponding(action)
    try {
      await respondForThread(threadId, action)
      await refresh()
    } finally {
      setResponding(null)
    }
  }

  if (state.status !== 'loaded') {
    return <div className="card p-6 text-sm text-gray-600">Yükleniyor…</div>
  }

  const { peer, messages, threadStatus, relation, canMessage, requestedById } = state
  const requestFromPeer = threadStatus === 'REQUESTED' && requestedById && requestedById !== meId
  const requestByMe = threadStatus === 'REQUESTED' && requestedById && requestedById === meId
  const showArchived = threadStatus === 'ARCHIVED'

  const canSend = canMessage && !showArchived && !requestByMe

  return (
    <div className="card p-0 overflow-hidden flex flex-col min-h-[60vh]">
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <button
          type="button"
          onClick={() => router.push('/messages')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="Geri"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
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
      </div>

      <div className="px-4 py-3 border-b bg-amber-50 text-amber-900 text-sm" hidden={!requestFromPeer && !requestByMe && !showArchived && relation === 'mutual'}>
        {showArchived && (
          <div className="flex items-center justify-between gap-3">
            <span>Bu sohbet arşivlendi. Yeniden mesajlaşmak için takip etmeniz gerekiyor.</span>
          </div>
        )}
        {requestFromPeer && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium">Bu kullanıcı sana mesaj isteği gönderdi. Kabul edersen birbirinizi takip ediyor olacaksınız.</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRespond('DECLINE')}
                disabled={responding === 'DECLINE'}
                className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 hover:bg-amber-100 disabled:opacity-60"
              >
                Reddet
              </button>
              <button
                type="button"
                onClick={() => handleRespond('ACCEPT')}
                disabled={responding === 'ACCEPT'}
                className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-amber-700 disabled:opacity-60"
              >
                Kabul et
              </button>
            </div>
          </div>
        )}
        {requestByMe && !showArchived && (
          <div>Mesaj isteğin karşı tarafın onayını bekliyor. Kabul edilene kadar yeni mesaj gönderemezsin.</div>
        )}
        {!requestFromPeer && !requestByMe && !showArchived && relation !== 'mutual' && (
          <div>Tek taraflı takiptesiniz. Mesaj göndermek için takip etmeniz gerekiyor.</div>
        )}
      </div>

      <div className="flex-1 overflow-auto px-4 py-4 space-y-3 bg-white">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-600">Henüz mesaj yok.</div>
        ) : (
          messages.map((m) => {
            const isMine = meId && m.authorId === meId
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                    isMine ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div>{m.body}</div>
                  <div className="text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleString('tr-TR')}</div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t px-3 py-3 bg-white">
        <div className="flex flex-col gap-2 text-xs text-gray-500 mb-2" hidden={canSend}>
          {!canMessage && !showArchived && !requestFromPeer && (
            <div>Mesaj göndermek için karşılıklı takip gerekiyor.</div>
          )}
          {requestByMe && <div>İsteğin onaylanana kadar mesaj gönderemezsin.</div>}
          {showArchived && <div>Arşivlenen sohbetlerde mesajlaşma kapalı.</div>}
        </div>
        <div className="flex items-center gap-2">
          <input
            id="dm-input"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={canSend ? 'Mesaj yazın…' : 'Mesaj gönderemezsiniz'}
            className="flex-1 rounded-full border px-4 py-2 outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            disabled={!canSend || busy}
          />
          <button
            type="button"
            onClick={send}
            disabled={!canSend || busy || !body.trim()}
            className="inline-flex h-10 px-4 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold disabled:opacity-50"
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  )
}
