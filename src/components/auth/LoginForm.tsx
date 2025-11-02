// src/components/auth/LoginForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import Recaptcha from '@/components/Captcha'

export default function LoginForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')

  useEffect(() => {
    const e = sp.get('error')
    if (e) {
      setError(e === 'CredentialsSignin' ? 'E-posta veya şifre hatalı.' : 'Giriş yapılamadı.')
    }
  }, [sp])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        captchaToken,
      })
      if (!res) {
        setError('Beklenmeyen hata.')
        return
      }
      if (res.error) {
        setError(res.error === 'CredentialsSignin' ? 'E-posta veya şifre hatalı.' : 'Giriş yapılamadı.')
        return
      }
      router.push('/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const requireCaptcha = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY)

  return (
    <div className="max-w-md mx-auto p-6 mt-8">
      <h1 className="text-2xl font-bold mb-2">Giriş Yap</h1>
      <p className="text-sm text-gray-500 mb-6">
        Hesabın yok mu?{' '}
        <Link className="text-rose-600 hover:underline" href="/register">
          Kayıt ol
        </Link>
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3">
          {error}
        </div>
      )}

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
        <div>
          <label className="block text-sm font-medium mb-1">Şifre</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <div className="mt-3"><Recaptcha onVerify={(t) => setCaptchaToken(t)} /></div>
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-sm text-rose-600 hover:underline">
              Şifremi unuttum
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || (requireCaptcha && !captchaToken)}
          className="w-full rounded-xl bg-rose-600 text-white py-2.5 font-medium hover:bg-rose-700 disabled:opacity-60"
        >
          {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>
    </div>
  )
}

function Captcha({ onVerify }: { onVerify: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''
  useEffect(() => {
    if (!siteKey) { onVerify('dev'); return }
    const id = 'recaptcha-script'
    if (!document.getElementById(id)) {
      const s = document.createElement('script')
      s.src = 'https://www.google.com/recaptcha/api.js'
      s.async = true
      s.defer = true
      s.id = id
      document.body.appendChild(s)
    }
    ;(window as any).onRecaptchaLogin = (token: string) => onVerify(token)
    return () => {}
  }, [])
  if (!siteKey) return null
  return <div className="pt-2"><div className="g-recaptcha" data-sitekey={siteKey} data-callback="onRecaptchaLogin" /></div>
}
