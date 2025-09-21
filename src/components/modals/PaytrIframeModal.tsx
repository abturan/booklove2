// src/components/modals/PaytrIframeModal.tsx
'use client'

import { useEffect } from 'react'

export default function PaytrIframeModal({
  open,
  onClose,
  iframeUrl,
  title = 'Güvenli Ödeme — PayTR',
}: {
  open: boolean
  onClose: () => void
  iframeUrl: string | null
  title?: string
}) {
  // Body scroll lock + Esc ile kapatma
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  // iFrame resizer
  useEffect(() => {
    if (!open) return
    const s = document.createElement('script')
    s.src = 'https://www.paytr.com/js/iframeResizer.min.js'
    s.async = true
    s.onload = () => {
      // @ts-ignore
      if (window.iFrameResize) window.iFrameResize({ checkOrigin: false }, '#paytriframe')
    }
    document.body.appendChild(s)
    return () => {
      document.body.removeChild(s)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* Backdrop */}
      <button
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative w-[96%] max-w-3xl h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <div className="font-medium">{title}</div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-full w-8 h-8 grid place-items-center hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        {/* Content: kendi içinde scroll olur */}
        <div className="flex-1 overflow-auto">
          {iframeUrl ? (
            <iframe
              id="paytriframe"
              src={iframeUrl}
              frameBorder={0}
              scrolling="yes"
              // iFrameResizer yükseklik ayarlasa da, container overflow-auto olduğu için
              // içerik taşarsa modal içinde dikey scroll aktif kalır.
              style={{ width: '100%', minHeight: '100%' }}
            />
          ) : (
            <div className="p-6">Ödeme sayfası hazırlanıyor…</div>
          )}
        </div>
      </div>
    </div>
  )
}
