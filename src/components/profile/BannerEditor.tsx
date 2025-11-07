// src/components/profile/BannerEditor.tsx
'use client'

import * as React from 'react'

type Props = {
  initialUrl?: string | null
  onSaved?: (url: string) => void
  isAdmin?: boolean
}

type Message = { type: 'success' | 'error'; text: string }

export default function BannerEditor({ initialUrl, onSaved, isAdmin = false }: Props) {
  const [busy, setBusy] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const [message, setMessage] = React.useState<Message | null>(null)

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    const isImage =
      (f.type && f.type.startsWith('image/')) ||
      (f.name && /\.(heic|heif|hevc|avif|png|jpe?g|gif|webp|bmp|tiff?)$/i.test(f.name))
    if (!isImage) {
      setMessage({ type: 'error', text: 'Lütfen desteklenen bir görsel dosyası seçin.' })
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    const maxBytes = 5 * 1024 * 1024
    if (!isAdmin && f.size > maxBytes) {
      setMessage({ type: 'error', text: 'Banner görseli en fazla 5MB olabilir.' })
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      const up = await fetch('/api/upload?type=banner', { method: 'POST', body: fd })
      const uj = await up.json()
      if (!up.ok || !uj?.url) throw new Error(uj?.error || 'Yükleme başarısız.')

      const pf = new FormData()
      pf.append('bannerUrl', uj.url)
      const res = await fetch('/api/profile', { method: 'POST', body: pf })
      if (!res.ok) throw new Error('Kaydedilemedi.')

      onSaved?.(uj.url)
      window.dispatchEvent(new CustomEvent('me:updated'))
      setMessage({ type: 'success', text: 'Banner güncellendi.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Banner güncellenemedi.' })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="absolute right-3 bottom-3 z-10">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={pick}
        disabled={busy}
      />
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="px-4 py-2 rounded-full bg-white/90 backdrop-blur text-gray-900 text-sm shadow disabled:opacity-60"
        >
          {busy ? 'Kaydediliyor…' : 'Bannerı Değiştir'}
        </button>
        {message && (
          <div
            className={`w-full max-w-xs rounded-2xl px-3 py-1.5 text-xs ${
              message.type === 'success'
                ? 'bg-white/90 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}
