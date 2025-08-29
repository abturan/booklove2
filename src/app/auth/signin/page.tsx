// src/app/auth/signin/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type CsrfResp = { csrfToken: string }

function SignInInner() {
  const router = useRouter()
  const sp = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [csrf, setCsrf] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1) CSRF token’ı al (Auth.js v5)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch('/api/auth/csrf', { cache: 'no-store' })
        const j = (await r.json()) as CsrfResp
        if (alive) setCsrf(j.csrfToken || '')
      } catch {
        // yut
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // Dışarıdan error=? geldiyse göster (ör. başka akışlardan)
  useEffect(() => {
    const err = sp.get('error')
    if (err) setError('Giriş yapılamadı. E-posta veya şifre hatalı.')
  }, [sp])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      /**
       * 2) signIn() yerine düşük seviye endpoint:
       *    /api/auth/callback/credentials?json=true
       * - Content-Type: application/x-www-form-urlencoded
       * - redirect=false (zorunlu)
       * - csrfToken, email, password alanları
       *
       * Bu çağrı **asla** tarayıcı redirect'i yapmaz; JSON döner.
       */
      const body = new URLSearchParams()
      body.set('redirect', 'false')
      body.set('csrfToken', csrf || '')
      body.set('email', email)
      body.set('password', password)

      const r = await fetch('/api/auth/callback/credentials?json=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })

      const j = await r.json().catch(() => ({} as any))

      // Başarısız: hata mesajını bas, hiçbir yere gitme
      if (!r.ok || j.error) {
        setError('Giriş yapılamadı. E-posta veya şifre hatalı.')
        return
      }

      // Başarılı: kendimiz yönlendiririz
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

      <form className="space-y-3" onSubmit={handleSubmit} noValidate>
        <input
          className="w-full rounded-2xl border px-4 py-3"
          placeholder="E-posta"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full rounded-2xl border px-4 py-3"
          placeholder="Şifre"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* csrf hidden → Auth v5 callback endpointi istiyor */}
        <input type="hidden" name="csrfToken" value={csrf} readOnly />

        <button
          type="submit"
          className="w-full rounded-2xl bg-gray-900 text-white py-3 disabled:opacity-50"
          disabled={loading || !csrf}
          aria-busy={loading}
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
    <Suspense fallback={<div className="max-w-md mx-auto p-6 mt-8">Yükleniyor…</div>}>
      <SignInInner />
    </Suspense>
  )
}
