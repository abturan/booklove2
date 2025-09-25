// src/components/profile/BannerChanger.tsx
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BannerChanger() {
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function pick() {
    fileRef.current?.click()
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!['image/png', 'image/jpeg'].includes(f.type)) return alert('PNG/JPG yükleyin.')
    if (f.size > 5 * 1024 * 1024) return alert('En fazla 5MB.')

    setBusy(true)
    try {
      // 1) Upload
      const fd = new FormData()
      fd.append('file', f)
      const up = await fetch('/api/upload?type=banner', { method: 'POST', body: fd })
      const j = await up.json()
      if (!up.ok || !j?.url) throw new Error(j?.error || 'Yükleme hatası')

      // 2) Kaydet
      const res = await fetch('/api/me', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bannerUrl: j.url }),
      })
      const k = await res.json()
      if (!res.ok || !k?.ok) throw new Error(k?.error || 'Kaydedilemedi')

      // 3) Anında yansıt
      window.dispatchEvent(new CustomEvent('me:updated'))
      router.refresh()
    } catch (e: any) {
      alert(e?.message || 'Hata')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onFile} />
      <button
        onClick={pick}
        disabled={busy}
        className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm disabled:opacity-60"
        title="Bannerı değiştir"
      >
        {busy ? 'Yükleniyor…' : 'anner Changer Bannerı değiştir'}
      </button>
    </>
  )
}
