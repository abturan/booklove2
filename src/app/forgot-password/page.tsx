// src/app/forgot-password/page.tsx
'use client'

import { useState } from 'react'

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-8">
      <h1 className="text-2xl font-bold mb-2">Şifremi unuttum</h1>
      <p className="text-sm text-gray-600 mb-6">
        E-posta adresini yaz; eğer sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderilecektir.
      </p>
      {sent ? (
        <div className="rounded-xl bg-green-50 text-green-700 px-4 py-3">
          Eğer e-posta sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">E-posta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              placeholder="ornek@boook.love"
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-rose-600 text-white py-2.5 font-medium hover:bg-rose-700 disabled:opacity-60"
          >
            {loading ? 'Gönderiliyor…' : 'Bağlantı gönder'}
          </button>
        </form>
      )}
    </div>
  )
}
