'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || 'Kayıt başarısız')

      // Otomatik login
      const r = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (r?.error) throw new Error('Giriş başarısız')

      // Ana sayfaya ve header’ı anında güncelle
      router.replace('/')
      router.refresh()
    } catch (e: any) {
      setErr(e.message || 'Bir hata oluştu')
    } finally {
      setSubmitting(false)
      if (!err) setMsg('Kayıt başarılı! Artık giriş yapabilirsiniz.')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Kayıt ol</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Ad Soyad"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
        />
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
        />
        <input
          type="password"
          placeholder="Şifre (min 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-rose-600 text-white py-3 font-medium disabled:opacity-60"
        >
          {submitting ? 'Kaydediliyor…' : 'Kayıt ol'}
        </button>

        <p className="text-sm text-gray-600">
          Zaten hesabın var mı?{' '}
          <Link className="text-rose-600 underline" href="/login">
            Giriş yap
          </Link>
        </p>
      </form>

      {err && (
        <div className="mt-4 rounded-lg bg-red-50 text-red-700 px-4 py-3">
          {err}
        </div>
      )}
      {msg && !err && (
        <div className="mt-4 rounded-lg bg-green-50 text-green-700 px-4 py-3">
          {msg}
        </div>
      )}
    </div>
  )
}
