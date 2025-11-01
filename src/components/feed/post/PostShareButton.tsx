'use client'

import { useMemo, useRef, useState } from 'react'
import BareModal from '@/components/ui/BareModal'
import { loadHtmlToImage } from '@/lib/htmlToImage'

type Owner = {
  name?: string | null
  username?: string | null
  slug?: string | null
  id: string
}

export default function PostShareButton({
  postId,
  body,
  owner,
  images,
  canInstagramShare = false,
}: {
  postId: string
  body: string
  owner: Owner
  images?: { url: string | null }[]
  canInstagramShare?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)

  const sharePreview = useMemo(() => {
    const text = body.trim()
    if (text.length <= 280) return text
    return `${text.slice(0, 277)}…`
  }, [body])

  const previewImage = useMemo(() => {
    if (!Array.isArray(images)) return null
    for (const img of images) {
      const url = typeof img?.url === 'string' ? img.url.trim() : ''
      if (url) return url
    }
    return null
  }, [images])

  const handleNativeShare = async () => {
    const { url, profileUrl } = buildShareUrls(postId, owner)
    const text = [
      `${owner.name || 'Bir okur'} Bookie paylaştı.`,
      owner.username ? `@${owner.username}` : '',
      profileUrl,
      '',
      sharePreview,
      '',
      url,
    ]
      .filter(Boolean)
      .join('\n')

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${owner.name || 'Bookie'} paylaşımı`,
          text,
          url,
        })
        setMessage('Paylaşım gönderildi.')
        return
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return
      }
    }
    await copyToClipboard(url)
    setMessage('Bağlantı panoya kopyalandı.')
  }

  const handleInstagramShare = () => {
    if (!canInstagramShare) return
    const { url } = buildShareUrls(postId, owner)
    const target = `${url}?instagram=1`
    window.open(target, '_blank', 'noopener,noreferrer')
  }

  const handleDownloadImage = async () => {
    if (downloading) return
    if (!cardRef.current) {
      setMessage('Görsel hazırlanamadı.')
      return
    }

    setMessage(null)
    setDownloading(true)
    try {
      const htmlToImage = await loadHtmlToImage()
      if (!htmlToImage) throw new Error('Dış hizmet yüklenemedi')
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 0.98, pixelRatio: 2, cacheBust: true })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `bookie-${postId}.png`
      link.click()
      setMessage('Görsel indirildi. Instagram hikayenize ekleyebilirsiniz.')
    } catch (err) {
      console.error('[share] download error', err)
      setMessage('Görsel indirilemedi, lütfen tekrar deneyin.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage(null)
          setOpen(true)
        }}
        className="inline-flex items-center justify-center rounded-full border border-primary/30 px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 gap-0 sm:gap-2 sm:px-3"
        aria-label="Paylaş"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="M12 16V4" strokeLinecap="round" />
          <path d="m8 8 4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden sm:inline">Paylaş</span>
      </button>

      <BareModal open={open} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Bookie paylaş</h3>
          <div ref={cardRef} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Boook.love</div>
            <div className="text-[15px] leading-7 text-gray-800 whitespace-pre-line">{sharePreview}</div>
            {previewImage && (
              <div className="mt-3 overflow-hidden rounded-xl">
                <img src={previewImage} alt="" className="block w-full max-h-48 rounded-xl object-cover" loading="lazy" />
              </div>
            )}
            <div className="mt-3 text-xs text-gray-500">
              @{owner.username || owner.slug || 'booklover'} • {buildShareUrls(postId, owner).profileUrl}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={handleNativeShare}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Cihazda paylaş
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadImage()}
              disabled={downloading}
              className="rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
            >
              {downloading ? 'Kaydediliyor…' : 'Görseli kaydet'}
            </button>
            <button
              type="button"
              onClick={handleInstagramShare}
              disabled={!canInstagramShare}
              className="rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
              title={!canInstagramShare ? 'Bu özellik sadece yöneticilere açıktır.' : undefined}
            >
              Instagram&#39;da paylaş
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Instagram seçeneği Bookie paylaşımını yeni sekmede açar ve metni panoya kopyalamanız için yönlendirme yapar. Görseli kaydet ile paylaşımı cihazınıza indirebilirsiniz.
          </p>
          {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
        </div>
      </BareModal>
    </>
  )
}

function buildShareUrls(postId: string, owner: Owner) {
  const origin =
    (typeof window !== 'undefined' && window.location.origin) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    ''
  const base = origin.endsWith('/') ? origin.slice(0, -1) : origin
  const profileHandle = owner.username || owner.slug || owner.id
  const profileUrl = `${base}/u/${profileHandle}`
  const url = `${base}/bookie/share/${postId}`
  return { url, profileUrl }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    try {
      document.execCommand('copy')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}
