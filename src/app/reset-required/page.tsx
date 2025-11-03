'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function ResetRequiredPage() {
  const router = useRouter()
  const [required, setRequired] = useState<boolean | null>(null)
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/me/reset-required', { cache: 'no-store' })
        const j = await r.json()
        setRequired(!!j?.required)
      } catch {
        setRequired(false)
      }
    })()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (p1.length < 6) return setError('Şifre en az 6 karakter olmalı.')
    if (p1 !== p2) return setError('Şifreler aynı olmalı.')
    setLoading(true)
    try {
      const r = await fetch('/api/me/password/set-new', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ newPassword: p1 }) })
      const j = await r.json(); if (!r.ok || !j?.ok) { setError(j?.error || 'İşlem yapılamadı'); return }
      setDone(true)
      setTimeout(() => router.push('/'), 1200)
    } finally {
      setLoading(false)
    }
  }

  if (required === null) return <div className="max-w-md mx-auto p-6 mt-8">Yükleniyor…</div>
  if (!required) return (
    <div className="max-w-md mx-auto p-6 mt-8">
      <h1 className="text-2xl font-bold mb-2">Şifre sıfırlama gerekli değil</h1>
      <button onClick={() => router.push('/')} className="mt-3 rounded-xl border px-4 py-2 hover:bg-gray-50">Ana sayfa</button>
    </div>
  )

  return (
    <div className="max-w-md mx-auto p-6 mt-8">
      <h1 className="text-2xl font-bold mb-2">Yeni şifrenizi belirleyin</h1>
      <p className="text-sm text-gray-600 mb-4">Güvenliğiniz için girişten önce şifrenizi güncellemeniz gerekiyor.</p>
      {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3">{error}</div>}
      {done ? (
        <div className="rounded-xl bg-green-50 text-green-700 px-4 py-3">Şifreniz güncellendi. Yönlendiriliyorsunuz…</div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Yeni şifre</label>
            <input type="password" value={p1} onChange={(e) => setP1(e.target.value)} className="w-full rounded-xl border px-4 py-3" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Yeni şifre (tekrar)</label>
            <input type="password" value={p2} onChange={(e) => setP2(e.target.value)} className="w-full rounded-xl border px-4 py-3" required />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-rose-600 text-white py-2.5 font-medium hover:bg-rose-700 disabled:opacity-60">
            {loading ? 'Güncelleniyor…' : 'Şifreyi belirle'}
          </button>
        </form>
      )}
    </div>
  )
}

