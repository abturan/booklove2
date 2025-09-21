// src/components/SubscribeButton.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubscribeButton({
  clubId,
  clubSlug,
  clubName,
  price,          // TL (ör. 49)
  email,
  userName,
  userAddress,
  userPhone,
}: {
  clubId: string
  clubSlug: string
  clubName: string
  price: number
  email: string
  userName?: string
  userAddress?: string
  userPhone?: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    try {
      setLoading(true)
      const res = await fetch('/api/paytr/get-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userName: userName || 'Abone',
          userAddress: userAddress || 'Türkiye',
          userPhone: userPhone || '0000000000',
          amount: price,
          clubId,
          clubName,
          redirectSlug: `clubs/${clubSlug}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Ödeme başlatılamadı')

      // iFrame URL’ini sakla ve iFrame sayfasına git
      sessionStorage.setItem(`paytr_iframe_${data.merchant_oid}`, data.iframe_url)
      router.push(`/subscribe/checkout/${encodeURIComponent(data.merchant_oid)}`)
    } catch (e: any) {
      alert(e?.message || 'Ödeme başlatılamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      id="subscribe"
      onClick={handleClick}
      disabled={loading}
      className="rounded-full bg-rose-600 text-white px-5 py-2.5 shadow hover:opacity-90 disabled:opacity-60"
    >
      {loading ? 'İşleniyor…' : `Abone ol (₺${price.toFixed(2)})`}
    </button>
  )
}
