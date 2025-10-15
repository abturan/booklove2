// src/app/reset-password/page.tsx
'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto p-6 mt-8">Yükleniyor…</div>}>
      <ResetPasswordInner />
    </Suspense>
  )
}

function ResetPasswordInner() {
  const sp = useSearchParams()
  const router = useRouter()
  const token = sp.get('token') || ''
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError('Geçersiz bağlantı.')
      return
    }
    if (p1.length < 6) {
      setError('Şifre en az 6 karakter olmalı.')
      return
    }
    if (p1 !== p2) {
      setError('Şifreler aynı olmalı.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password: p1 }),
      })
      const j = await res.json()
      if (!res.ok || !j.ok) {
        setError(j.error || 'İşlem yapılamadı.')
        return
      }
      setDone(true)
      setTimeout(() => router.push('/login'), 1200)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-8">
      <h1 className="text-2xl font-bold mb-2">Şifreyi sıfırla</h1>
      {!token && <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3">Geçersiz bağlantı.</div>}
      {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3">{error}</div>}
      {done ? (
        <div className="rounded-xl bg-green-50 text-green-700 px-4 py-3">Şifren güncellendi. Yönlendiriliyorsun…</div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Yeni şifre</label>
            <input
              type="password"
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Yeni şifre (tekrar)</label>
            <input
              type="password"
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-xl bg-rose-600 text-white py-2.5 font-medium hover:bg-rose-700 disabled:opacity-60"
          >
            {loading ? 'Güncelleniyor…' : 'Şifreyi güncelle'}
          </button>
        </form>
      )}
    </div>
  )
}






