// src/components/messages/NewChatPicker.tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'

type Friend = { id: string; name: string | null; username: string | null; avatarUrl: string | null }

export default function NewChatPicker() {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [items, setItems] = React.useState<Friend[]>([])
  const router = useRouter()

  React.useEffect(() => {
    let ac = new AbortController()
    async function run() {
      const term = q.trim()
      if (!open || term.length === 0) {
        setItems([])
        return
      }
      try {
        const res = await fetch(`/api/friends/search?q=${encodeURIComponent(term)}`, { cache: 'no-store', signal: ac.signal })
        const j = await res.json().catch(() => null)
        if (res.ok && Array.isArray(j?.items)) setItems(j.items)
        else setItems([])
      } catch {}
    }
    run()
    return () => ac.abort()
  }, [q, open])

  async function startChat(peerId: string) {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/dm/open?peerId=${encodeURIComponent(peerId)}`, { cache: 'no-store' })
      const j = await res.json().catch(() => null)
      if (res.ok && j?.threadId) {
        setOpen(false)
        router.push(`/messages/${j.threadId}`)
        router.refresh()
        window.dispatchEvent(new CustomEvent('dm:changed'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="fixed right-4 top-[112px] lg:top-auto lg:bottom-6 lg:right-6 z-50">
        <button
          type="button"
          aria-label="Yeni sohbet"
          onClick={() => setOpen(true)}
          className="h-11 w-11 rounded-full bg-gray-900 text-white grid place-content-center shadow"
        >
          <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-4 top-[18vh] lg:top-[20vh] mx-auto max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="text-sm font-semibold">Yeni sohbet</div>
              <button onClick={() => setOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border">
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="p-4">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Arkadaş ara..."
                className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900"
                autoFocus
              />
              <ul className="mt-3 max-h-[48vh] overflow-auto divide-y">
                {q.trim().length > 0 && items.length === 0 && (
                  <li className="px-2 py-3 text-sm text-gray-600">Sonuç yok.</li>
                )}
                {items.map((f) => (
                  <li key={f.id}>
                    <button
                      className="w-full flex items-center gap-3 px-2 py-2 hover:bg-gray-50 text-left"
                      onClick={() => startChat(f.id)}
                      disabled={busy}
                    >
                      <Avatar src={f.avatarUrl ?? null} size={36} alt={f.name || 'Kullanıcı'} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{f.name || 'Kullanıcı'}</div>
                        <div className="text-xs text-gray-600 truncate">{f.username ? `@${f.username}` : ''}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  )
}





