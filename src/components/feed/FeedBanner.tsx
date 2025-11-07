// src/components/feed/FeedBanner.tsx
'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Editable banner (Facebook benzeri). URL, localStorage’da saklanır.
 * Backend şemasına dokunmadan gerçek çalışır deneyim için tasarlandı.
 * İleride /api/profile ile persist edilecekse buradan kolayca entegre edilir.
 */
export default function FeedBanner() {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { data } = useSession()
  const isAdmin = ((data?.user as any)?.role ?? '') === 'ADMIN'

  useEffect(() => {
    const saved = localStorage.getItem('feed.banner.url')
    if (saved) setBannerUrl(saved)
  }, [])

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const isImage =
      (f.type && f.type.startsWith('image/')) ||
      (f.name && /\.(heic|heif|hevc|avif|png|jpe?g|gif|webp|bmp|tiff?)$/i.test(f.name))
    if (!isImage) {
      setErr('Lütfen yalnızca görsel dosyaları seçin.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    if (!isAdmin && f.size > 5 * 1024 * 1024) {
      setErr('Görseller en fazla 5MB olabilir.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setBusy(true); setErr(null)
    try {
      const fd = new FormData()
      fd.append('file', f)
      // /api/upload banner’ı /uploads/banners altına kaydediyor
      const res = await fetch('/api/upload?type=banner', { method: 'POST', body: fd })
      const j = await res.json()
      if (!res.ok || !j?.url) throw new Error(j?.error || 'Banner yüklenemedi.')
      setBannerUrl(j.url)
      localStorage.setItem('feed.banner.url', j.url)
    } catch (e: any) {
      setErr(e?.message || 'Hata')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="relative h-40 rounded-3xl overflow-hidden card p-0">
      <Image
        src={
          bannerUrl ||
          'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop'
        }
        alt="Feed banner"
        fill
        className="object-cover"
      />

      <div className="absolute right-3 bottom-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPick}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm disabled:opacity-60"
        >
          {busy ? 'Yükleniyor…' : 'Feed Bannerı değiştir'}
        </button>
      </div>

      {err && (
        <div className="absolute left-3 bottom-3 text-sm px-2 py-1 rounded bg-red-600/90 text-white">
          {err}
        </div>
      )}
    </div>
  )
}
