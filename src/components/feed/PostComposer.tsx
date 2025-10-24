// src/components/feed/PostComposer.tsx
'use client'

import { useRef, useState } from 'react'

export default function PostComposer({ onPosted }: { onPosted: (id: string) => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<{ url: string; width?: number; height?: number }[]>([])
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const maxImages = 5

  async function onSelectFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    const roomLeft = Math.max(0, maxImages - images.length)
    const arr = Array.from(files).slice(0, roomLeft)
    const uploaded: { url: string; width?: number; height?: number }[] = []
    for (const f of arr) {
      const fd = new FormData()
      fd.set('file', f)
      const res = await fetch('/api/upload?type=post', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok && data?.url) uploaded.push({ url: data.url })
      else setError(data?.error || 'Yükleme hatası')
    }
    setImages((prev) => [...prev, ...uploaded].slice(0, maxImages))
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  async function submit() {
    if (busy) return
    const body = text.trim()
    if (!body && images.length === 0) {
      setError('Lütfen bir şeyler yazın veya görsel ekleyin.')
      return
    }
    setBusy(true)
    setError(null)
    setOkMsg(null)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, images }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Gönderilemedi')
      setText('')
      setImages([])
      const status = String(data?.status || '').toUpperCase()
      if (status === 'PUBLISHED') {
        setOkMsg('Gönderiniz yayımlandı.')
      } else {
        setOkMsg('Gönderiniz alındı. Yönetici onayından sonra yayınlanacak.')
      }
      onPosted(String(data.id))
    } catch (e: any) {
      setError(e?.message || 'Gönderilemedi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ne düşünüyorsun?"
        className="w-full resize-y rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-rose-200"
        rows={2}
        maxLength={5000}
      />
      {images.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img src={img.url} alt="" className="rounded-xl object-cover w-full h-28" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 rounded-full bg-white/90 border px-2 py-0.5 text-xs hover:bg-white"
                aria-label="Görseli kaldır"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
      {okMsg && <div className="mt-2 text-xs text-green-700">{okMsg}</div>}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            multiple
            className="hidden"
            onChange={(e) => onSelectFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50"
            disabled={images.length >= maxImages}
            aria-disabled={images.length >= maxImages}
            title={images.length >= maxImages ? 'En fazla 5 görsel' : 'Görsel ekle'}
          >
            Görsel ekle ({images.length}/{maxImages})
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="rounded-full bg-rose-600 text-white px-4 py-1.5 text-sm font-medium hover:bg-rose-700 disabled:opacity-60"
        >
          Paylaş
        </button>
      </div>
    </div>
  )
}






