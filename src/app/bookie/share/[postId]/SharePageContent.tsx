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
  imageUrl: string | null
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
  imageUrl,
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
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 0.98, pixelRatio: 2, cacheBust: true })
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

  const handleInstagram = async () => {
    setFeedback(null)
    const storyUrl = 'https://www.instagram.com/create/story/'

    let opened = false
    let appWindow: Window | null = null
    try {
      appWindow = window.open('instagram://story-camera', '_blank')
      opened = !!appWindow
    } catch {
      opened = false
    }

    setTimeout(() => {
      if (!opened || (document.visibilityState === 'visible')) {
        try {
          window.open(storyUrl, '_blank', 'noopener,noreferrer')
        } catch (err) {
          console.warn('[share] instagram web fallback unavailable', err)
        }
      }
    }, 600)

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(messageToCopy)
        setFeedback('Metin panoya kopyalandı. Instagram hikayelerinde paylaşabilirsiniz.')
      } catch (err) {
        console.warn('[share] clipboard error', err)
        setFeedback('Metin kopyalanamadı, lütfen metni elle kopyalayın.')
      }
    } else {
      setFeedback('Tarayıcı panoya kopyalamayı desteklemiyor, lütfen metni elle kopyalayın.')
    }

    return appWindow
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
    if (instagramMode) {
      const timer = setTimeout(() => {
        handleInstagram()
      }, 200)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [instagramMode])

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-white to-primary/10 py-8 px-4 sm:px-6 md:py-12">
      <div className="mx-auto w-full max-w-screen-sm space-y-6">
        <div ref={cardRef} className="rounded-3xl bg-white/90 p-6 shadow-2xl ring-1 ring-black/5 backdrop-blur">
          <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-primary/30">
              <img src={safeAvatarUrl(ownerAvatar, ownerName) || ''} alt={ownerName || 'Kullanıcı'} width={48} height={48} className="h-12 w-12 object-cover" />
            </div>
            <div>
              <div className="text-sm font-semibold text-primary">Bookie!</div>
              <div className="text-lg font-bold text-gray-900">{ownerName || 'Bir okur'}</div>
              {ownerUsername && <div className="text-sm text-gray-500">@{ownerUsername}</div>}
            </div>
          </header>

          <article className="rounded-2xl bg-white p-5 ring-1 ring-black/5 shadow-inner">
            <p className="whitespace-pre-line text-[15px] leading-7 text-gray-800">{body}</p>
            {imageUrl ? (
              <div className="mt-4 overflow-hidden rounded-2xl">
                <img src={imageUrl} alt="" width={900} height={900} className="h-auto w-full object-cover" />
              </div>
            ) : null}
          </article>

          <footer className="mt-4 text-xs text-gray-500">
            Profil:{' '}
            <a href={profileUrl} className="font-semibold text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {profileUrl}
            </a>
          </footer>
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
              onClick={handleInstagram}
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
