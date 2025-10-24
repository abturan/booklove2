// src/components/Footer.tsx
'use client'

import Image from 'next/image'
import { useState } from 'react'
import ManifestoModal from '@/components/modals/ManifestoModal'

function SocialIcon({ href, title, children }: any) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-neutral-200 hover:bg-neutral-100 transition"
      title={title}
    >
      {children}
    </a>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()
  const [open, setOpen] = useState(false)

  return (
    <>
      <footer className="mt-auto border-t border-neutral-200 bg-neutral-50/80 backdrop-blur overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="text-lg font-semibold tracking-tight">boook.love</div>
            <p className="text-sm text-neutral-600">
              Okurları; kulüpler, seçkiler ve moderatörlü sohbetlerle bir araya getiren kitap kulübü platformu.
            </p>
            <p className="text-xs text-neutral-500">© {year} boook.love — Tüm hakları saklıdır.</p>

            <div className="flex gap-2 pt-2">
              <SocialIcon href="https://x.com/booklovetr" title="X (Twitter)">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2H21l-6.52 7.46L22 22h-6.813l-5.32-6.894L3.955 22H2l6.98-7.98L2 2h6.813l4.98 6.457L18.244 2Zm-1.193 18h1.651L7.03 3.94H5.29L17.05 20Z" fill="currentColor"/>
                </svg>
              </SocialIcon>
              <SocialIcon href="https://www.instagram.com/booklovetr" title="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a5.5 5.5 0 1 1 0 11.001A5.5 5.5 0 0 1 12 7.5Zm0 2a3.5 3.5 0 1 0 0 7.001 3.5 3.5 0 0 0 0-7.001ZM18 6.2a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Z" fill="currentColor"/>
                </svg>
              </SocialIcon>
            </div>
          </div>

          <nav className="md:justify-center flex flex-col space-y-2 text-sm">
            <button
              onClick={() => setOpen(true)}
              className="text-left hover:text-black text-neutral-700"
              aria-label="Manifesto"
            >
              Manifesto
            </button>
            <a href="/mesafeli-satis-sozlesmesi" className="hover:text-black text-neutral-700">Mesafeli Satış Sözleşmesi</a>
            <a href="/gizlilik-sozlesmesi" className="hover:text-black text-neutral-700">Gizlilik Sözleşmesi</a>
            <a href="/iletisim" className="hover:text-black text-neutral-700">İletişim</a>
          </nav>

          <div className="md:justify-end flex flex-col items-start md:items-end gap-3">
            <span className="text-xs uppercase tracking-wide text-neutral-500">Güvenli Ödeme</span>
            <div className="flex flex-wrap items-center gap-4 max-w-full">
              <Image className="opacity-80 grayscale hover:opacity-100 transition h-7 w-auto max-w-full"
                     src="/logos/visa.svg" alt="Visa" width={68} height={28} />
              <Image className="opacity-80 grayscale hover:opacity-100 transition h-7 w-auto max-w-full"
                     src="/logos/mastercard.svg" alt="Mastercard" width={96} height={28} />
              <Image className="opacity-80 grayscale hover:opacity-100 transition h-7 w-auto max-w-full"
                     src="/logos/paytr.png" alt="PayTR ile Öde" width={116} height={28} />
            </div>
          </div>
        </div>
      </footer>

      <ManifestoModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}






