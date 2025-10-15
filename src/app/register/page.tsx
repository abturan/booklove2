// src/app/register/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/ui/modal'
import { TERMS_HTML } from '@/content/legal/terms'
import { KVKK_HTML } from '@/content/legal/kvkk'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeKvkk, setAgreeKvkk] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [openTerms, setOpenTerms] = useState(false)
  const [openKvkk, setOpenKvkk] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    if (!agreeKvkk || !agreeTerms) {
      setErr('Kayıt için “Kullanım Koşulları” ve “Kişisel Veriler Kanunu” metinlerini onaylamanız gerekir.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const j = await res.json()
      if (!res.ok || !j?.ok) {
        setErr(j?.message || 'Kayıt başarısız.')
        return
      }
      setMsg('OK')
    } catch {
      setErr('Sunucuya ulaşılamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-8">
      <h1 className="text-2xl font-bold mb-2">Kayıt Ol</h1>
      <p className="text-sm text-gray-500 mb-6">
        Zaten hesabın var mı?{' '}
        <Link className="text-rose-600 hover:underline" href="/login">
          Giriş yap
        </Link>
      </p>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium mb-1">Ad Soyad</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onInvalid={(e) => {
              e.currentTarget.setCustomValidity('Lütfen ad soyad bilgisini doldurun.')
            }}
            onInput={(e) => e.currentTarget.setCustomValidity('')}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            placeholder="Ad Soyad"
            autoComplete="name"
            spellCheck={false}
            enterKeyHint="next"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">E-posta</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onInvalid={(e) => {
              e.currentTarget.setCustomValidity('Geçerli bir e-posta girin (ör. ornek@boook.love).')
            }}
            onInput={(e) => e.currentTarget.setCustomValidity('')}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            placeholder="ornek@boook.love"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Şifre</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onInvalid={(e) => {
              const el = e.currentTarget
              if (el.validity.valueMissing) {
                el.setCustomValidity('Lütfen bir şifre belirleyin.')
              } else if (el.validity.tooShort) {
                el.setCustomValidity('Şifre en az 6 karakter olmalı.')
              } else {
                el.setCustomValidity('Geçerli bir şifre girin.')
              }
            }}
            onInput={(e) => e.currentTarget.setCustomValidity('')}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            placeholder="En az 6 karakter"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border"
              checked={agreeKvkk}
              onChange={(e) => setAgreeKvkk(e.target.checked)}
              required
              onInvalid={(e) => {
                e.currentTarget.setCustomValidity('Devam edebilmek için KVKK metnini onaylamalısınız.')
              }}
              onInput={(e) => e.currentTarget.setCustomValidity('')}
            />
            <span className="text-sm">
              <button
                type="button"
                className="text-rose-600 underline underline-offset-4"
                onClick={() => setOpenKvkk(true)}
              >
                Kişisel Veriler Kanunu (KVKK)
              </button>{' '}
              metnini okudum ve onaylıyorum.
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
              onInvalid={(e) => {
                e.currentTarget.setCustomValidity('Devam edebilmek için Kullanım Koşulları’nı onaylamalısınız.')
              }}
              onInput={(e) => e.currentTarget.setCustomValidity('')}
            />
            <span className="text-sm">
              <button
                type="button"
                className="text-rose-600 underline underline-offset-4"
                onClick={() => setOpenTerms(true)}
              >
                Kullanım Koşulları
              </button>{' '}
              metnini okudum ve onaylıyorum.
            </span>
          </label>
        </div>

        {msg && !err && (
          <Link
            href="/login"
            className="block text-center rounded-xl bg-green-600 text-white py-2.5 font-semibold hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            Kayıt başarılı!  <u>Giriş yapabilirsiniz</u>
          </Link>
        )}

        <button
          type="submit"
          disabled={submitting || Boolean(msg)}
          aria-disabled={submitting || Boolean(msg)}
          className="w-full rounded-xl bg-rose-600 text-white py-2.5 font-medium hover:bg-rose-700 disabled:opacity-60"
        >
          {submitting ? 'Kayıt yapılıyor…' : 'Kayıt ol'}
        </button>

        {err && (
          <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3">
            {err}
          </div>
        )}
      </form>

      <Modal open={openKvkk} onClose={() => setOpenKvkk(false)} title="Kişisel Veriler Kanunu (KVKK)">
        <article
          className="legal-content text-sm leading-relaxed text-gray-800"
          dangerouslySetInnerHTML={{ __html: KVKK_HTML }}
        />
      </Modal>

      <Modal open={openTerms} onClose={() => setOpenTerms(false)} title="Kullanım Koşulları">
        <article
          className="legal-content text-sm leading-relaxed text-gray-800"
          dangerouslySetInnerHTML={{ __html: TERMS_HTML }}
        />
      </Modal>
    </div>
  )
}
