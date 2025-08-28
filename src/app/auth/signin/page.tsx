// src/app/auth/signin/page.tsx
'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'

function SignInInner() {
  const router = useRouter()
  const sp = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const err = sp.get('error')
    if (err) setError('Giriş yapılamadı. E-posta veya şifre hatalı.')
  }, [sp])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await signIn('credentials', {
        redirect: false,   // 🔒 yönlendirme kontrolü bizde
        email,
        password,
      })

      // 🔒 Başarı kriteri: SADECE res.ok === true
      if (!res || res.ok !== true) {
        setError('Giriş yapılamadı. E-posta veya şifre hatalı.')
        return
      }

      // ✅ başarılı giriş
      router.replace('/')
      router.refresh()
    } catch {
      setError('Sunucu hatası. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto card p-6 mt-8">
      <h2 className="text-xl font-semibold mb-4">Giriş yap</h2>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-2xl border px-4 py-3"
          placeholder="E-posta"
          autoComplete="username"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full rounded-2xl border px-4 py-3"
          placeholder="Şifre"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full rounded-2xl bg-gray-900 text-white py-3 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '...' : 'Giriş yap'}
        </button>
      </form>

      <p className="mt-3 text-sm">
        Hesabın yok mu?{' '}
        <Link href="/auth/register" className="underline">
          Kayıt ol
        </Link>
      </p>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto p-6 mt-8">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      }
    >
      <SignInInner />
    </Suspense>
  )
}
