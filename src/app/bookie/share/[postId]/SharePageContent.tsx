'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
// Use native <img> for reliable html-to-image capture
import { safeAvatarUrl } from '@/lib/avatar'
import { loadHtmlToImage } from '@/lib/htmlToImage'

type Props = {
  postId: string
  body: string
  ownerName: string
  ownerUsername: string | null
  ownerAvatar: string | null
  imageUrls: string[]
  profileUrl: string
  shareUrl: string
  sharePreview: string
  instagramMode: boolean
  downloadMode: boolean
}

export default function SharePageContent({
  postId,
  body,
  ownerName,
  ownerUsername,
  ownerAvatar,
  imageUrls,
  profileUrl,
  shareUrl,
  sharePreview,
  instagramMode,
  downloadMode,
}: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const messageToCopy = useMemo(() => {
    const lines = [sharePreview.trim()]
    if (lines[0].length > 0 && !lines[0].endsWith('.')) {
      lines[0] = `${lines[0]}`
    }
    lines.push('', `Profil: ${profileUrl}`)
    return lines.join('\n')
  }, [profileUrl, sharePreview])

  async function waitForImages() {
    const node = cardRef.current
    if (!node) return
    const imgs = Array.from(node.querySelectorAll('img'))
    await Promise.all(
      imgs.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((res) => {
              img.addEventListener('load', () => res(), { once: true })
              img.addEventListener('error', () => res(), { once: true })
            }),
      ),
    )
  }

  async function handleSaveImage(auto = false) {
    if (!cardRef.current) return
    if (!auto) setFeedback(null)
    setSaving(true)
    try {
      const htmlToImage = await loadHtmlToImage()
      if (!htmlToImage) throw new Error('Dış hizmet yüklenemedi')
      await waitForImages()
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
      } as any)
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `bookie-${postId}.png`
      link.click()
      if (!auto) setFeedback('Görsel indirildi. Instagram hikayenize ekleyebilirsiniz.')
    } catch (err) {
      setFeedback('Görsel indirilemedi. Lütfen ekran görüntüsü almayı deneyin.')
      console.error('[share] save image error', err)
    } finally {
      setSaving(false)
    }
  }

  const shareToInstagram = async () => {
    setFeedback(null)
    try {
      const htmlToImage = await loadHtmlToImage()
      if (!htmlToImage || !cardRef.current) throw new Error('Hazırlık başarısız')
      await waitForImages()
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 0.98, pixelRatio: 2, backgroundColor: '#ffffff' } as any)
      const blob = await (async () => {
        const arr = dataUrl.split(',')
        const bstr = atob(arr[1])
        const u8 = new Uint8Array(bstr.length)
        for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
        return new Blob([u8], { type: 'image/png' })
      })()
      const file = new File([blob], `bookie-${postId}.png`, { type: 'image/png' })
      const canFiles = typeof (navigator as any).canShare === 'function' && (navigator as any).canShare({ files: [file] })
      if (canFiles && typeof (navigator as any).share === 'function') {
        await (navigator as any).share({ files: [file], text: messageToCopy })
        setFeedback('Paylaşım ekranı açıldı. Instagram’ı seçebilirsiniz.')
        return
      }
    } catch (e) {
      // Sessiz düş
    }

    // Dosya ile paylaşım mümkün değilse: Önce indirt, sonra Instagram web sayfasını tek seferde aç, metni kopyala.
    await handleSaveImage(true)
    try {
      const storyUrl = 'https://www.instagram.com/create/story/'
      window.open(storyUrl, '_blank', 'noopener,noreferrer')
    } catch {}
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(messageToCopy); setFeedback('Metin kopyalandı. Instagram’da görseli galeriden seçin.') } catch {}
    }
  }

  const handleOpenSharePage = () => {
    try {
      window.open(shareUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.warn('[share] sayfa açma hatası', err)
      setFeedback('Sayfa yeni sekmede açılamadı, lütfen açılır pencere engelleyicisini kontrol edin.')
    }
  }

  useEffect(() => {
    if (downloadMode) {
      const timer = setTimeout(() => {
        void handleSaveImage(true)
      }, 200)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [downloadMode])

  useEffect(() => {
    if (!instagramMode) return
    const t = setTimeout(() => { void shareToInstagram() }, 200)
    return () => clearTimeout(t)
  }, [instagramMode])

  const maybeProxy = (u: string) => (u && /^https?:\/\//i.test(u) ? `/api/img-proxy?u=${encodeURIComponent(u)}` : u)

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-white to-primary/10 py-6 px-3 md:py-10">
      <div className="mx-auto w-full max-w-screen-sm space-y-6">
        {/* Fixed-size story card (9:16) for consistent exports */}
        <div
          ref={cardRef}
          style={{ width: 720, height: 1280, background: '#fff', borderRadius: 28, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.14)', position: 'relative' }}
        >
          {/* Brand header */}
          <div style={{ height: 84, background: '#fa3d30', color: '#fff', display: 'flex', alignItems: 'center', padding: '0 24px', fontWeight: 800, letterSpacing: '.3px' }}>
            book.love
          </div>
          {/* Content */}
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, height: 1280 - 84, boxSizing: 'border-box' }}>
            {/* Owner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 999, overflow: 'hidden', boxShadow: '0 0 0 3px rgba(250,61,48,.25)' }}>
                <img
                  src={safeAvatarUrl(ownerAvatar, ownerName) || ''}
                  alt={ownerName || 'Kullanıcı'}
                  width={48}
                  height={48}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  style={{ width: 48, height: 48, objectFit: 'cover' }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#111827' }}>{ownerName || 'Bir okur'}</div>
                {ownerUsername && <div style={{ fontSize: 13, color: '#6b7280' }}>@{ownerUsername}</div>}
              </div>
            </div>

            {/* Body text (clamped) */}
            <div
              style={{
                fontSize: 18,
                lineHeight: 1.7,
                color: '#1f2937',
                whiteSpace: 'pre-wrap',
                display: '-webkit-box',
                WebkitLineClamp: 8,
                WebkitBoxOrient: 'vertical' as any,
                overflow: 'hidden',
              }}
            >
              {body}
            </div>

            {/* Image area with contain fit */}
            {Array.isArray(imageUrls) && imageUrls.length > 0 && (
              <div style={{ flex: '0 0 auto', height: 520, borderRadius: 20, background: '#f3f4f6', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.05)' }}>
                {renderMosaic(imageUrls.map(maybeProxy))}
              </div>
            )}

            {/* Footer pinned to bottom */}
            <div style={{ marginTop: 'auto', fontSize: 12, color: '#6b7280' }}>
              <span>@{ownerUsername || 'booklover'}</span>
              <span> • </span>
              <span>{profileUrl}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/90 p-4 text-sm text-gray-700 shadow ring-1 ring-black/5 backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <button
              type="button"
              onClick={() => handleSaveImage()}
              disabled={saving}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-75"
            >
              {saving ? 'Kaydediliyor…' : 'Görseli kaydet'}
            </button>
            <button
              type="button"
              onClick={() => void shareToInstagram()}
              className="rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              Instagram’ı aç
            </button>
            <button
              type="button"
              onClick={handleOpenSharePage}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sayfayı aç
            </button>
          </div>

          {feedback && <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">{feedback}</div>}

          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-700">
            <li>Görseli kaydettikten sonra Instagram uygulamasında Hikayeler bölümünden paylaşabilirsiniz.</li>
            <li>Paylaşım metni panoya kopyalanırsa hikayenize yapıştırabilirsiniz.</li>
            <li>
              Profil bağlantısını eklemek için{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-800">{profileUrl}</code> adresini hikayenize yazabilirsiniz.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function renderMosaic(urls: string[]) {
  const list = urls.filter(Boolean)
  const one = list.length === 1
  const two = list.length === 2
  const three = list.length === 3
  const fourOrMore = list.length >= 4

  const tile = (src: string, key: string, style: React.CSSProperties = {}) => (
    <div key={key} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <img
        src={src}
        alt=""
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: one ? 'contain' : 'cover' }}
      />
    </div>
  )

  if (one) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={list[0]}
          alt=""
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </div>
    )
  }
  if (two) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%', gap: 6 }}>
        {tile(list[0], 'i0')}
        {tile(list[1], 'i1')}
      </div>
    )
  }
  if (three) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: '100%', height: '100%', gap: 6 }}>
        <div style={{ gridRow: '1 / span 2' }}>{tile(list[0], 'i0')}</div>
        {tile(list[1], 'i1')}
        {tile(list[2], 'i2')}
      </div>
    )
  }
  // 4+ : first 4 in 2x2 grid, last tile shows "+N"
  const extra = list.length - 4
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: '100%', height: '100%', gap: 6 }}>
      {tile(list[0], 'i0')}
      {tile(list[1], 'i1')}
      {tile(list[2], 'i2')}
      <div style={{ position: 'relative' }}>
        {tile(list[3], 'i3')}
        {extra > 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 48 }}>+{extra}</div>
        )}
      </div>
    </div>
  )
}
