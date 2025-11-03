// src/components/messages/ChatWindow.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'
import Modal from '@/components/ui/modal'

type Peer = { id: string; name: string | null; username: string | null; slug: string | null; avatarUrl: string | null }
type Message = { id: string; authorId: string; body: string; createdAt: string; reactions?: Record<string, number>; mine?: string[] }

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
  const [focusMsg, setFocusMsg] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

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
            // Mark thread as read when opened/loaded
            try {
              await fetch('/api/dm/mark-read', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ threadId }),
              })
              window.dispatchEvent(new Event('dm:counts'))
            } catch {}
          } else {
            setState({
              status: 'loaded',
              peer: j?.peer || { id: '', name: null, username: null, slug: null, avatarUrl: null },
              messages: [],
              threadStatus: 'REQUESTED',
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
            threadStatus: 'REQUESTED',
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
    window.addEventListener('friends:changed', handleChange)
    return () => {
      cancelled = true
      window.removeEventListener('dm:changed', handleChange)
      window.removeEventListener('friends:changed', handleChange)
    }
  }, [threadId])

  // read ?msg= query and focus that message when loaded
  useEffect(() => {
    try {
      const usp = new URLSearchParams(window.location.search)
      const m = usp.get('msg')
      if (m) setFocusMsg(m)
    } catch {}
  }, [])

  useEffect(() => {
    if (state.status !== 'loaded' || !focusMsg) return
    const el = document.getElementById(`m-${focusMsg}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      try {
        el.classList.add('ring-2', 'ring-primary')
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 2000)
      } catch {}
      setFocusMsg(null)
    }
  }, [state, focusMsg])

  // reactions disabled

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
        try {
          await fetch('/api/dm/mark-read', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ threadId }),
          })
          window.dispatchEvent(new Event('dm:counts'))
        } catch {}
      }
    } catch {}
  }

  // toggleReaction removed

  async function send() {
    if (state.status !== 'loaded') return
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

  async function saveEdit(messageId: string) {
    if (state.status !== 'loaded') return
    const text = editText.trim()
    if (!text) return
    try {
      await fetch(`/api/dm/message/${messageId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body: text }) })
      setEditingId(null)
      setEditText('')
      await refresh()
    } catch {}
  }

  async function confirmDelete(messageId: string) {
    try {
      await fetch(`/api/dm/message/${messageId}`, { method: 'DELETE' })
      setDeleteId(null)
      await refresh()
    } catch {}
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
  // Mesaj isteği akışı: karşılıklı takip olmasa da yazmaya izin ver (isteğe düşsün)
  const canSend = relation !== 'self'
  const displayName = (peer?.name && peer.name.trim()) ? peer.name : (peer?.username ? `@${peer.username}` : 'Kullanıcı')
  const subUsername = peer?.username && peer?.name ? `@${peer.username}` : ''

  return (
    <>
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
          <Avatar src={peer?.avatarUrl ?? null} size={36} alt={displayName} />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{displayName}</div>
            <div className="text-xs text-gray-600 truncate">{subUsername}</div>
          </div>
        </Link>
      </div>

      <div className="px-4 py-3 border-b bg-amber-50 text-amber-900 text-sm" hidden={!requestFromPeer && relation === 'mutual'}>
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
        {requestByMe && (
          <div>Mesaj isteğin karşı tarafın onayını bekliyor. Onaylanana kadar mesajların istek kutusunda görünecek.</div>
        )}
        {!requestFromPeer && relation !== 'mutual' && (
          <div>Tek taraflı takiptesiniz. Gönderdiğin mesajlar istek olarak iletilecek.</div>
        )}
      </div>

      <div className="flex-1 overflow-auto px-4 py-4 space-y-3 bg-white">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-600">Henüz mesaj yok.</div>
        ) : (
          messages.map((m) => {
            const isMine = meId && m.authorId === meId
            const editing = editingId === m.id
            return (
              <div key={m.id} id={`m-${m.id}`} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`group relative max-w-[70%] rounded-2xl px-3 py-2 text-sm ${isMine ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  {!editing ? (
                    <>
                      <div>{m.body}</div>
                      <div className="text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleString('tr-TR')}</div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className={`w-64 max-w-[70vw] rounded-xl border px-2 py-1 text-sm ${isMine ? 'text-gray-900' : ''}`}
                        rows={3}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingId(null); setEditText('') }} className="rounded-full border px-3 py-0.5 text-xs bg-white/90 text-gray-700">Vazgeç</button>
                        <button onClick={() => saveEdit(m.id)} className="rounded-full px-3 py-0.5 text-xs bg-primary text-white">Kaydet</button>
                      </div>
                    </div>
                  )}
                  {isMine && !editing && (
                    <div className="absolute -top-2 right-0 hidden gap-2 group-hover:flex">
                      <button
                        className="rounded-full bg-white/80 text-gray-700 px-2 py-0.5 text-[11px] hover:bg-white"
                        onClick={() => { setEditingId(m.id); setEditText(m.body) }}
                        title="Düzenle"
                      >
                        Düzenle
                      </button>
                      <button
                        className="rounded-full bg-white/80 text-red-600 px-2 py-0.5 text-[11px] hover:bg-white"
                        onClick={() => setDeleteId(m.id)}
                        title="Sil"
                      >
                        Sil
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t px-3 py-3 bg-white">
        <div className="flex flex-col gap-2 text-xs text-gray-500 mb-2" hidden={relation === 'mutual'}>
          {requestFromPeer && <div>Bu kullanıcıdan gelen bir mesaj isteği var. Kabul ettiğinizde karşılıklı takip başlayacak.</div>}
          {requestByMe && <div>Mesaj isteğin onay bekliyor; yine de mesaj yazabilirsin.</div>}
          {!requestFromPeer && relation !== 'mutual' && <div>Karşı tarafla karşılıklı takip olmadığından mesajların istek olarak gidecek.</div>}
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
    <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Mesajı sil">
      <div className="space-y-3">
        <div className="text-sm text-gray-700">Bu mesajı silmek istediğine emin misin? Bu işlem geri alınamaz.</div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteId(null)} className="rounded-full border px-3 py-1 text-sm">Vazgeç</button>
          <button onClick={() => deleteId && confirmDelete(deleteId)} className="rounded-full bg-rose-600 text-white px-3 py-1 text-sm">Evet, sil</button>
        </div>
      </div>
    </Modal>
    </>
  )
}
