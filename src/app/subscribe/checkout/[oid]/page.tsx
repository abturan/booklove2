// src/app/subscribe/checkout/[oid]/page.tsx
'use client'
import { useEffect, useState } from 'react'

export default function CheckoutPage({ params, searchParams }: any) {
  const { oid } = params
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Bu sayfaya gelmeden önce /api/paytr/get-token çağrılmış olabilir.
    // Token yoksa burada tekrar isteyebilirsiniz (gerekliyse).
    const url = sessionStorage.getItem(`paytr_iframe_${oid}`)
    if (url) setIframeUrl(url)
  }, [oid])

  useEffect(() => {
    // iFrame height auto
    const s = document.createElement('script')
    s.src = 'https://www.paytr.com/js/iframeResizer.min.js'
    s.onload = () => {
      // @ts-ignore
      if (window.iFrameResize) window.iFrameResize({}, '#paytriframe')
    }
    document.body.appendChild(s)
    return () => { document.body.removeChild(s) }
  }, [])

  if (error) return <div className="text-red-600">{error}</div>
  if (!iframeUrl) return <div>Ödeme sayfası hazırlanıyor…</div>

  return (
    <div className="max-w-3xl mx-auto">
      <iframe
        id="paytriframe"
        src={iframeUrl}
        frameBorder={0}
        scrolling="no"
        style={{ width: '100%', minHeight: 800 }}
      />
    </div>
  )
}
