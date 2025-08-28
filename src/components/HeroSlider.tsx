'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

const fallback1 =
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1600&auto=format&fit=crop'
const fallback2 =
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop'
const fallback3 =
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1600&auto=format&fit=crop'

const slides = [
  { id: 1, title: "Okuma Spotlight'ı", subtitle: "Kulüpler, aylık seçkiler ve yeni kitaplar — hepsi tek akışta.", image: fallback1 },
  { id: 2, title: "Yazar kürasyonlu kulüpler", subtitle: "Katıl, keşfet, oku.", image: fallback2 },
  { id: 3, title: "Boook.Love", subtitle: "Sohbet et, etkinliklere katıl, sosyalleş.", image: fallback3 }
]

export default function HeroSlider() {
  const [index, setIndex] = useState(0)
  const timer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    timer.current = setInterval(() => setIndex(i => (i + 1) % slides.length), 4000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [])

  const s = slides[index]
  return (
    <div className="relative overflow-hidden rounded-3xl h-56 sm:h-64 md:h-72 lg:h-80">
      <Image src={s.image} alt="" fill className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
      <div className="absolute left-6 right-6 top-8 text-white">
        <div className="text-xs uppercase tracking-widest opacity-80">BOOOKLOVE</div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold drop-shadow">{s.title}</h1>
        <p className="mt-2 max-w-2xl text-white/90">{s.subtitle}</p>
      </div>
    </div>
  )
}
