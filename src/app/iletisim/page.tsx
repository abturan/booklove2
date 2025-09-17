// src/app/iletisim/page.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Gönderilemedi')
      setDone(true)
      form.reset()
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <section className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight">İletişim</h1>
        <p className="mt-3 text-neutral-700">
          Mesajınız alındı. En kısa sürede dönüş yapacağız. Teşekkürler!
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-block rounded-lg border px-4 py-2 hover:bg-neutral-50"
          >
            Ana sayfaya dön
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="text-3xl font-bold tracking-tight">İletişim</h1>
      <p className="mt-3 text-neutral-700">
        Bize bu form üzerinden ulaşabilirsiniz. E-posta: <strong>info@boook.love</strong>
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Adınız"
          required
          className="w-full rounded-lg border px-4 py-3"
        />
        <input
          type="email"
          name="email"
          placeholder="E-posta"
          required
          className="w-full rounded-lg border px-4 py-3"
        />
        <input
          type="text"
          name="subject"
          placeholder="Konu (opsiyonel)"
          className="w-full rounded-lg border px-4 py-3"
        />
        <textarea
          name="message"
          placeholder="Mesajınız"
          required
          rows={6}
          className="w-full rounded-lg border px-4 py-3"
        />
        {/* Honeypot */}
        <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
        <button
          disabled={loading}
          className="rounded-lg bg-black text-white px-5 py-3 disabled:opacity-60"
        >
          {loading ? 'Gönderiliyor…' : 'Gönder'}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </section>
  )
}






