// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (!res?.ok) {
      setLoading(false)
      setError('E-posta veya şifre hatalı.')
      return
    }

    // Session’dan rolü çek ve yönlendir
    try {
      const r = await fetch('/api/auth/session', { cache: 'no-store' })
      const s = await r.json()
      const role = s?.user?.role
      if (role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/')
      }
      router.refresh()
    } catch {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="max-w-md mx-auto my-10">
      <h1 className="text-2xl font-semibold mb-6">Giriş yap</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">E-posta</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400"
            placeholder="ornek@eposta.com"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Şifre</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-rose-600 text-white py-2.5 font-medium hover:bg-rose-700 disabled:opacity-60"
        >
          {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>

      <div className="mt-6 text-sm text-gray-500">
        Admin test hesabı: <span className="font-mono">superadmin@book.love / admin123</span>
      </div>
    </div>
  )
}
