// src/components/feed/PostComposer.tsx
'use client'

import { useState } from 'react'

type Props = { onPosted?: () => void }

export default function PostComposer({ onPosted }: Props) {
  const [body, setBody] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const fd = new FormData()
    fd.append('file', f)
    const res = await fetch('/api/upload?type=post', { method: 'POST', body: fd })
    const j = await res.json()
    if (j?.url) setImages((prev) => [...prev, j.url])
    else setErr(j?.error || 'Yükleme hatası')
  }

  async function submit() {
    if (busy) return                      // ekstra koruma
    if (!body.trim() && images.length === 0) return

    setBusy(true); setErr(null)

    // ⬇️ Her denemede tekil bir istemci belirteci üret
    const clientToken =
      (globalThis.crypto && 'randomUUID' in globalThis.crypto)
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        body: body.trim(),
        images: images.map((url) => ({ url })),
        clientToken,                      // ⬅️ idempotency anahtarı
      })
    })
    const j = await res.json().catch(() => null)
    setBusy(false)
    if (!res.ok) { setErr(j?.error || 'Hata'); return }
    setBody(''); setImages([])
    onPosted?.()
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="p-4 border-b">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ne düşünüyorsun?"
          className="w-full bg-transparent outline-none"
        />
      </div>
      {!!images.length && (
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {images.map((u, i) => (
              <div key={i} className="relative aspect-video overflow-hidden rounded-lg border">
                <img src={u} alt="" className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        </div>
      )}
      {err && <div className="px-4 pb-2 text-sm text-red-600">{err}</div>}
      <div className="flex items-center justify-between px-4 py-3">
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="file" accept="image/png,image/jpeg" onChange={onFile} className="hidden" />
          <span className="px-3 py-1.5 rounded-full border">Görsel ekle</span>
        </label>
        <button
          onClick={submit}
          disabled={busy}
          className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm disabled:opacity-60"
        >
          {busy ? 'Paylaşılıyor…' : 'Paylaş'}
        </button>
      </div>
    </div>
  )
}
