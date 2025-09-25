// src/components/friends/RequestButton.tsx
'use client'

import { useState } from 'react'

export default function RequestButton({
  toUserId,
  initialState = 'idle',
}: {
  toUserId: string
  initialState?: 'idle' | 'sent'
}) {
  const [sent, setSent] = useState(initialState === 'sent')
  const [busy, setBusy] = useState(false)

  async function send() {
    if (busy || sent) return
    setBusy(true)
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ toUserId }),
      })
      // backend tekil kısıt ihlalinde 409 döner → yine “gönderildi” kabul et
      if (res.status === 409) {
        setSent(true)
        return
      }
      const j = await res.json().catch(() => ({} as any))
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Hata')
      setSent(true)
    } catch (e: any) {
      alert(e?.message || 'Hata')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={send}
      disabled={busy || sent}
      className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-sm disabled:opacity-60"
    >
      {sent ? 'İstek gönderildi' : busy ? 'Gönderiliyor…' : 'Arkadaş olarak ekle'}
    </button>
  )
}
