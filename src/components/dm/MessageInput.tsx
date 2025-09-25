// src/components/dm/MessageInput.tsx
'use client'

import { useState } from 'react'

type Msg = { id: string; authorId: string; body: string; createdAt: string }

export default function MessageInput({ peerId, onSent }: { peerId: string; onSent: (m: Msg) => void }) {
  const [val, setVal] = useState('')
  const [busy, setBusy] = useState(false)

  async function send() {
    const body = val.trim()
    if (!body || busy) return
    setBusy(true)
    try {
      const clientToken = crypto.randomUUID()
      const res = await fetch('/api/dm/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ peerId, body, clientToken }),
      })
      const j = await res.json()
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Hata')
      onSent(j.message as Msg)
      setVal('')
    } catch (e) {
      alert('Gönderilemedi')
    } finally {
      setBusy(false)
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex items-end gap-2">
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={onKey}
        rows={1}
        className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm"
        placeholder="Mesaj yazın…"
      />
      <button
        onClick={send}
        disabled={busy || val.trim().length === 0}
        className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm disabled:opacity-60"
      >
        Gönder
      </button>
    </div>
  )
}
