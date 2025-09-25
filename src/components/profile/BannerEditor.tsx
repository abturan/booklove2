// src/components/profile/BannerEditor.tsx
'use client'

import * as React from 'react'

type Props = {
  initialUrl?: string | null
  onSaved?: (url: string) => void
}

export default function BannerEditor({ initialUrl, onSaved }: Props) {
  const [busy, setBusy] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement | null>(null)

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    if (f.size > 2 * 1024 * 1024) { alert('Banner en fazla 2MB olmalı.'); return }
    if (!['image/png', 'image/jpeg'].includes(f.type)) { alert('Sadece PNG/JPG kabul edilir.'); return }

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
    } catch (err: any) {
      alert(err?.message || 'Hata oluştu.')
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
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={pick}
        disabled={busy}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="px-4 py-2 rounded-full bg-white/90 backdrop-blur text-gray-900 text-sm shadow disabled:opacity-60"
      >
        {busy ? 'Kaydediliyor…' : 'Bannerı Değiştir'}
      </button>
    </div>
  )
}
