'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubscribeButton({
  clubId,
  clubSlug,
  price
}: { clubId: string; clubSlug: string; price: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    const res = await fetch(`/api/clubs/${clubId}/subscribe`, { method: 'POST' })
    setLoading(false)
    if (!res.ok) {
      alert('Abonelik başlatılamadı. Lütfen giriş yaptığından emin ol.')
      return
    }
    // başarı → kulüp sayfasına (ya da istersek /chat)
    router.push(`/clubs/${clubSlug}?subscribed=1`)
  }

  return (
    <button
      id="subscribe"
      onClick={handleClick}
      disabled={loading}
      className="rounded-full bg-rose-600 text-white px-5 py-2.5 shadow hover:opacity-90 disabled:opacity-60"
    >
      {loading ? 'İşleniyor…' : `Abone ol (₺${price})`}
    </button>
  )
}
