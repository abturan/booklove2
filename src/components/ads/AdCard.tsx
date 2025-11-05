// src/components/ads/AdCard.tsx
'use client'

type Ad = { id: string; title: string; type: string; slot?: 'feed'|'hero'|'sidebar'; imageUrl?: string | null; linkUrl?: string | null; html?: string | null; mobileImageUrl?: string | null; desktopImageUrl?: string | null; mobileHtml?: string | null; desktopHtml?: string | null; resolvedImageUrl?: string | null; resolvedHtml?: string | null }

export default function AdCard({ ad, device = 'all' as 'mobile' | 'desktop' | 'all' }: { ad: Ad; device?: 'mobile' | 'desktop' | 'all' }) {
  if (!ad) return null as any
  const img = ad.resolvedImageUrl || (device === 'mobile' ? ad.mobileImageUrl : ad.desktopImageUrl) || ad.imageUrl
  const html = ad.resolvedHtml || (device === 'mobile' ? ad.mobileHtml : ad.desktopHtml) || ad.html
  if (ad.type === 'image_full' && img) {
    const aspect = ad.slot === 'hero' ? 'aspect-[32/9]' : ad.slot === 'sidebar' ? 'aspect-[5/8]' : (device === 'mobile' ? 'aspect-video' : 'aspect-[3/1]')
    // Sidebar kartı tam sayfa genişliği almak zorunda değil; makul bir maksimum genişlikte merkezleyelim
    const wrapper = ad.slot === 'sidebar' ? 'mx-auto max-w-[320px] sm:max-w-[360px]' : ''
    const inner = (
      <div className={`relative w-full overflow-hidden rounded-2xl ${aspect}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={ad.title} className="absolute inset-0 h-full w-full object-cover" />
      </div>
    )
    return (
      <div className={`card p-0 overflow-hidden ${wrapper}`}>
        {ad.linkUrl ? (
          <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" aria-label={ad.title}>
            {inner}
          </a>
        ) : inner}
      </div>
    )
  }

  // announcement
  return (
    <div className="card p-4 bg-gradient-to-br from-rose-50 to-white">
      <div className="text-xs font-semibold uppercase tracking-widest text-rose-500">Duyuru</div>
      <div className="mt-1 text-base font-semibold">{ad.title}</div>
      {html && (
        <div className="prose prose-sm mt-2" dangerouslySetInnerHTML={{ __html: html }} />
      )}
      {ad.linkUrl && (
        <div className="mt-3">
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
          >
            İncele →
          </a>
        </div>
      )}
    </div>
  )
}
