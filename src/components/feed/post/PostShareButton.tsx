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

  const previewImages = useMemo(() => {
    const arr: string[] = []
    if (Array.isArray(images)) {
      for (const img of images) {
        const url = typeof img?.url === 'string' ? img.url.trim() : ''
        if (url) arr.push(url)
      }
    }
    return arr
  }, [images])

  const handleNativeShare = async () => {
    const { url, profileUrl } = buildShareUrls(postId, owner)
    const lines = [
      `${owner.name || 'Bir okur'} Bookie paylaştı.`,
      owner.username ? `@${owner.username}` : '',
      profileUrl,
      '',
      sharePreview,
    ].filter(Boolean)
    const text = lines.join('\n')

    // 1) Prefer sharing branded image if possible (Web Share with Files)
    try {
      const canFiles = typeof (navigator as any).canShare === 'function'
      if (canFiles && cardRef.current) {
        // ensure images loaded and node visible
        cardRef.current.scrollIntoView({ block: 'center' })
        await waitForImages()
        const htmlToImage = await loadHtmlToImage()
        if (htmlToImage) {
          const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 0.98, pixelRatio: 2, backgroundColor: '#ffffff' })
          const blob = dataUrlToBlob(dataUrl)
          const file = new File([blob], `bookie-${postId}.png`, { type: 'image/png' })
          if ((navigator as any).canShare({ files: [file] })) {
            await (navigator as any).share({ files: [file], text })
            setMessage('Paylaşım gönderildi.')
            return
          }
        }
      }
    } catch (e) {
      // ignore and fallback
    }

    // 2) Fallback: native share with url+text if supported
    if (navigator.share) {
      try {
        await navigator.share({ title: `${owner.name || 'Bookie'} paylaşımı`, text, url })
        setMessage('Paylaşım gönderildi.')
        return
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return
      }
    }
    // 3) Fallback: panoya kopyala
    await copyToClipboard(url + '\n\n' + text)
    setMessage('Bağlantı ve metin panoya kopyalandı.')
  }

  const handleInstagramShare = () => {
    if (!canInstagramShare) return
    const { url } = buildShareUrls(postId, owner)
    const target = `${url}?instagram=1`
    window.open(target, '_blank', 'noopener,noreferrer')
  }

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
      await waitForImages()
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 0.98, pixelRatio: 2, cacheBust: true, backgroundColor: '#ffffff' })
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

  function dataUrlToBlob(dataUrl: string) {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) u8arr[n] = bstr.charCodeAt(n)
    return new Blob([u8arr], { type: mime })
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
          <div ref={cardRef} className="rounded-2xl border border-gray-200 bg-white p-0 shadow-sm overflow-hidden">
            <div className="h-10 bg-primary text-white flex items-center px-3 text-xs font-extrabold tracking-wide">boook.love</div>
            <div className="p-4 space-y-3">
              <div className="text-[15px] leading-7 text-gray-800 whitespace-pre-line">{sharePreview}</div>
              {previewImages.length > 0 && (
                <div className="mt-1 overflow-hidden rounded-xl bg-gray-100">
                  {renderMosaic(previewImages)}
                </div>
              )}
              <div className="text-xs text-gray-500">
                @{owner.username || owner.slug || 'booklover'} • {buildShareUrls(postId, owner).profileUrl}
              </div>
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

function renderMosaic(urls: string[]) {
  const list = urls.filter(Boolean)
  const one = list.length === 1
  const two = list.length === 2
  const three = list.length === 3
  const fourOrMore = list.length >= 4

  const tile = (src: string, key: string) => (
    <div key={key} className="relative w-full h-full">
      <img
        src={`/api/img-proxy?u=${encodeURIComponent(src)}`}
        alt=""
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        className={one ? 'max-h-48 w-full object-contain' : 'absolute inset-0 h-full w-full object-cover'}
      />
    </div>
  )

  if (one) {
    return (
      <div className="flex items-center justify-center">
        <img src={`/api/img-proxy?u=${encodeURIComponent(list[0])}`} alt="" crossOrigin="anonymous" referrerPolicy="no-referrer" className="max-h-48 w-full object-contain" />
      </div>
    )
  }
  if (two) {
    return (
      <div className="grid grid-cols-2 gap-1 h-48">
        {tile(list[0], 'i0')}
        {tile(list[1], 'i1')}
      </div>
    )
  }
  if (three) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 h-48">
        <div className="row-span-2 relative">{tile(list[0], 'i0')}</div>
        {tile(list[1], 'i1')}
        {tile(list[2], 'i2')}
      </div>
    )
  }
  const extra = list.length - 4
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-1 h-48">
      {tile(list[0], 'i0')}
      {tile(list[1], 'i1')}
      {tile(list[2], 'i2')}
      <div className="relative">
        {tile(list[3], 'i3')}
        {extra > 0 && (
          <div className="absolute inset-0 bg-black/40 text-white grid place-items-center font-extrabold text-2xl">+{extra}</div>
        )}
      </div>
    </div>
  )
}
