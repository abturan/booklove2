// src/components/feed/PostComposer.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import useVerifyStatus from '@/lib/hooks/useVerifyStatus'
import EmojiPicker from '@/components/EmojiPicker'
import { prepareImageFile } from '@/lib/prepareImageFile'

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    const text = await res.text().catch(() => '')
    return { error: text || 'Beklenmeyen yanıt alındı.' }
  }
}

export default function PostComposer({ onPosted, repostOf }: { onPosted: (id: string) => void; repostOf?: { id: string; body: string; owner?: { name?: string | null; username?: string | null }; images?: { url: string }[] } }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  type ComposerImage = { url: string; width?: number | null; height?: number | null; pending?: boolean; tempId?: string }
  const [images, setImages] = useState<ComposerImage[]>([])
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const maxImages = 5
  const { verified } = useVerifyStatus()
  const canPost = verified === true
  const [emojiOpen, setEmojiOpen] = useState(false)
  const emojiBtnRef = useRef<HTMLButtonElement | null>(null)
  // nothing here; EmojiPicker handles outside/esc

  const isImageFile = (file: File) =>
    (file.type && file.type.startsWith('image/')) ||
    (file.name && /\.(heic|heif|hevc|avif|png|jpe?g|gif|webp|bmp|tiff?)$/i.test(file.name))

  async function onSelectFiles(files: FileList | null) {
    if (!files || files.length === 0 || !canPost) return
    setError(null)
    const roomLeft = Math.max(0, maxImages - images.length)
    const arr = Array.from(files).slice(0, roomLeft)
    for (let idx = 0; idx < arr.length; idx++) {
      const original = arr[idx]
      const prepared = await prepareImageFile(original)
      const tempId = `pending-${Date.now()}-${idx}-${Math.random()}`
      setImages((prev) => {
        if (prev.length >= maxImages) return prev
        return [...prev, { url: '', width: null, height: null, pending: true, tempId }]
      })
      if (!isImageFile(prepared)) {
        setError('Lütfen yalnızca görsel dosyaları seçin.')
        setImages((prev) => prev.filter((img) => img.tempId !== tempId))
        continue
      }
      if (prepared.size > 5 * 1024 * 1024) {
        setError('Görseller en fazla 5MB olabilir.')
        setImages((prev) => prev.filter((img) => img.tempId !== tempId))
        continue
      }
      const fd = new FormData()
      fd.set('file', prepared)
      try {
        const res = await fetch('/api/upload?type=post', { method: 'POST', body: fd })
        const data = await safeJson(res)
        if (res.ok && data?.url) {
          setImages((prev) =>
            prev.map((img) =>
              img.tempId === tempId
                ? {
                    url: data.url,
                    width: typeof data.width === 'number' ? data.width : null,
                    height: typeof data.height === 'number' ? data.height : null,
                    pending: false,
                  }
                : img,
            ),
          )
        } else {
          setError(data?.error || 'Yükleme hatası')
          setImages((prev) => prev.filter((img) => img.tempId !== tempId))
        }
      } catch (err) {
        console.error('[PostComposer] upload failed', err)
        setError('Görsel yüklenemedi, lütfen tekrar deneyin.')
        setImages((prev) => prev.filter((img) => img.tempId !== tempId))
      }
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  async function submit() {
    if (busy) return
    const body = text.trim()
    if (!canPost) {
      setError('Tüm özelliklerden faydalanmak için e‑postanızı doğrulayın.')
      return
    }
    if (!body && images.length === 0 && !repostOf) {
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
        body: JSON.stringify({ body, images, repostOfId: repostOf?.id }),
      })
      const data = await safeJson(res)
      if (!res.ok) {
        throw new Error(data?.error || 'Gönderilemedi')
      }
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
      {repostOf && (
        <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
          <div className="mb-1 text-xs text-gray-500">Rebookie</div>
          <div className="text-sm whitespace-pre-wrap">{repostOf.body}</div>
          {Array.isArray(repostOf.images) && repostOf.images.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {repostOf.images.slice(0, 4).map((img, i) => (
                <img key={i} src={img.url} alt="" className="rounded-lg object-cover w-full h-24" />
              ))}
            </div>
          )}
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={canPost ? 'Ne düşünüyorsun?' : 'Tüm özelliklerden faydalanmak için e‑postanızı doğrulayın'}
        className="w-full resize-y rounded-2xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-rose-200"
        rows={2}
        maxLength={5000}
        disabled={!canPost}
      />
      {images.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative">
              {img.pending ? (
                <div className="rounded-xl w-full h-28 bg-gray-100 animate-pulse flex items-center justify-center text-xs text-gray-500">
                  Yükleniyor…
                </div>
              ) : (
                <img src={img.url} alt="" className="rounded-xl object-cover w-full h-28" />
              )}
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
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onSelectFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => canPost && fileRef.current?.click()}
            className="rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50"
            disabled={images.length >= maxImages || !canPost}
            aria-disabled={images.length >= maxImages || !canPost}
            title={!canPost ? 'Önce e‑postanızı doğrulayın' : images.length >= maxImages ? 'En fazla 5 görsel' : 'Görsel ekle'}
          >
            Görsel ekle ({images.length}/{maxImages})
          </button>
          <div className="relative">
            <button ref={emojiBtnRef} type="button" disabled={!canPost} onClick={() => setEmojiOpen(v=>!v)} className="text-2xl leading-none text-slate-500 hover:text-slate-700 disabled:text-slate-300" aria-label="Emoji seç">🙂</button>
            <EmojiPicker open={emojiOpen} onClose={() => setEmojiOpen(false)} onPick={(e)=>{ setText(t => t + e); setEmojiOpen(false) }} anchorRef={emojiBtnRef} />
          </div>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={busy || !canPost}
          className="rounded-full bg-rose-600 text-white px-4 py-1.5 text-sm font-medium hover:bg-rose-700 disabled:opacity-60"
        >
          Paylaş
        </button>
      </div>
    </div>
  )
}
