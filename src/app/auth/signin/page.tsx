'use client'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SignIn() {
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

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl: '/' // <— ana sayfa
    })

    setLoading(false)
    if (res?.error) {
      setError('Giriş yapılamadı. E-posta veya şifre hatalı.')
      return
    }
    router.push(res?.url || '/')
  }

  return (
    <div className="max-w-md mx-auto card p-6 mt-8">
      <h2 className="text-xl font-semibold mb-4">Giriş yap</h2>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
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
        <button className="w-full rounded-2xl bg-gray-900 text-white py-3" disabled={loading}>
          {loading ? '...' : 'Giriş yap'}
        </button>
      </form>
      <p className="mt-3 text-sm">
        Hesabın yok mu? <Link href="/auth/register" className="underline">Kayıt ol</Link>
      </p>
    </div>
  )
}
