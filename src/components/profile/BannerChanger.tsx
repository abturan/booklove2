// src/components/profile/BannerChanger.tsx
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    const text = await res.text().catch(() => '')
    return { error: text || 'Beklenmeyen yanıt alındı.' }
  }
}

export default function BannerChanger() {
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { data } = useSession()
  const isAdmin = ((data?.user as any)?.role ?? '') === 'ADMIN'

  function pick() {
    fileRef.current?.click()
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const isImage =
      (f.type && f.type.startsWith('image/')) ||
      (f.name && /\.(heic|heif|hevc|avif|png|jpe?g|gif|webp|bmp|tiff?)$/i.test(f.name))
    if (!isImage) return alert('Lütfen görsel dosyası yükleyin.')
    if (!isAdmin && f.size > 5 * 1024 * 1024) return alert('En fazla 5MB.')

    setBusy(true)
    try {
      // 1) Upload
      const fd = new FormData()
      fd.append('file', f)
      const up = await fetch('/api/upload?type=banner', { method: 'POST', body: fd })
      const j = await safeJson(up)
      if (!up.ok || !j?.url) throw new Error(j?.error || 'Yükleme hatası')

      // 2) Kaydet
      const res = await fetch('/api/me', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bannerUrl: j.url }),
      })
      const k = await safeJson(res)
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
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
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
