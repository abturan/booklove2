// src/components/HeroSlider.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import clsx from 'clsx'

const BRAND_RED = '#fa3c30'

const slides = [
  { id: 1, title: 'Yazar kürasyonlu\nkulüpler', subtitle: 'Katıl, keşfet, oku.', img: '/banners/banner1.png' },
  { id: 2, title: 'Dünyanın tüm okurları,\nbirleşin!', subtitle: 'Kulüpler, seçkiler, yeni kitaplar.', img: '/banners/banner2.png' },
  { id: 3, title: 'book.love\nseni bekliyor', subtitle: 'Sohbet et, etkinliklere katıl, sosyalleş.', img: '/banners/banner3.png' },
  { id: 4, title: 'Arkadaşlarını ekle\nve keşfet', subtitle: 'Yeni dostluklar kur, birlikte oku.', img: '/banners/banner1.png' },
  { id: 5, title: 'Mesajlaş\nanında bağlan', subtitle: 'Özel mesajlarla sohbet et.', img: '/banners/banner2.png' },
  { id: 6, title: 'Paylaşım yap\nbeğeni topla', subtitle: 'Gönderiler oluştur, beğen ve yorumla.', img: '/banners/banner3.png' },
  { id: 7, title: 'Arkadaşlık kur\nçevreni büyüt', subtitle: 'Takip et, etkileşime geç, tanış.', img: '/banners/banner1.png' },
  { id: 8, title: 'Kulüplere katıl\nsohbete dahil ol', subtitle: 'İlgi alanına göre kulüp bul.', img: '/banners/banner2.png' },
  { id: 9, title: 'Aylık kitaplar\nmoderatörlerle', subtitle: 'Seçilen kitabı birlikte okuyun.', img: '/banners/banner3.png' },
  { id: 10, title: 'Etkinlikler\ncanlı buluşmalar', subtitle: 'Okuma seansları ve yayınlar.', img: '/banners/banner1.png' },
  { id: 11, title: 'Keşfet akışı\nyeni paylaşımlar', subtitle: 'Gündemi takip et, trendleri yakala.', img: '/banners/banner2.png' },
]

export default function HeroSlider() {
  const [i, setI] = useState(0)
  const timer = useRef<number | null>(null)
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    timer.current = window.setInterval(() => setI((x) => (x + 1) % slides.length), 5000)
    return () => {
      if (timer.current !== null) {
        window.clearInterval(timer.current)
        timer.current = null
      }
    }
  }, [])

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        const dock = e.boundingClientRect.top <= 64
        window.dispatchEvent(new CustomEvent('hero:dock', { detail: dock }))
      },
      { rootMargin: '-64px 0px 0px 0px', threshold: [0, 1] }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  function go(n: number) {
    setI((prev) => (prev + n + slides.length) % slides.length)
  }

  const s = slides[i]

  return (
    <div ref={hostRef} className="relative rounded-3xl overflow-hidden hero-fixed" style={{ background: BRAND_RED }}>
      <Image
        src={s.img}
        alt=""
        fill
        priority
        className="hidden sm:block object-contain object-right lg:object-right-bottom pointer-events-none select-none -z-0"
      />
      <div className="absolute inset-x-0 top-6 sm:top-8 lg:top-10 z-10 mt-2 ml-4 sm:ml-10">
        <div className="container">
          <div className="grid grid-cols-12 items-start gap-6">
            <div className="col-span-12 md:col-span-10 lg:col-span-10">
              <div className="flex items-start gap-4 sm:gap-6">
                <img src="/logos/logo-white.png" alt="book.love" className="w-14 sm:w-20 lg:w-28 h-auto shrink-0" />
                <div className="text-white">
                  <h1 className="leading-[1] font-semibold text-[26px] sm:text-[42px] lg:text-[56px] max-w-[18ch]">
                    {s.title.split('\n').map((line, idx) => (
                      <span key={idx} className="block">
                        {line}
                      </span>
                    ))}
                  </h1>
                  <p className="mt-2 sm:mt-3 text-sm sm:text-lg opacity-95">{s.subtitle}</p>
                </div>
              </div>
            </div>
            <div className="col-span-12 md:col-span-5 lg:col-span-5" />
          </div>
        </div>
      </div>
      {/* Dots: keep inside rounded container on desktop by adding a bit more inset */}
      <div className="absolute left-5 bottom-4 flex items-center gap-1.5 z-20 pointer-events-auto">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={clsx(
              'h-1.5 rounded-full transition-all',
              idx === i ? 'w-6 bg-white shadow-sm' : 'w-2.5 bg-white/70 hover:bg-white/90'
            )}
          />
        ))}
      </div>
      <div className="absolute right-4 bottom-4 flex items-center gap-1.5 z-20">
        <button
          onClick={() => go(-1)}
          aria-label="Önceki"
          className="h-8 w-8 rounded-full bg-white/90 ring-1 ring-white/70 text-gray-900/90 grid place-content-center shadow-sm backdrop-blur-sm hover:scale-[1.03] transition"
        >
          ‹
        </button>
        <button
          onClick={() => go(+1)}
          aria-label="Sonraki"
          className="h-8 w-8 rounded-full bg-white/90 ring-1 ring-white/70 text-gray-900/90 grid place-content-center shadow-sm backdrop-blur-sm hover:scale-[1.03] transition"
        >
          ›
        </button>
      </div>
    </div>
  )
}



