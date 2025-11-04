// src/app/register/page.tsx
'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import Modal from '@/components/ui/modal'
import { TERMS_HTML } from '@/content/legal/terms'
import { KVKK_HTML } from '@/content/legal/kvkk'
import Recaptcha from '@/components/Captcha'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [uLoading, setULoading] = useState(false)
  const [uErr, setUErr] = useState<string | null>(null)
  const [uOk, setUOk] = useState<boolean | null>(null)

  const [email, setEmail] = useState('')
  
  const [captchaToken, setCaptchaToken] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeKvkk, setAgreeKvkk] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [openTerms, setOpenTerms] = useState(false)
  const [openKvkk, setOpenKvkk] = useState(false)

  const kvkkHTML = useMemo(() => ({ __html: KVKK_HTML }), [])
  const termsHTML = useMemo(() => ({ __html: TERMS_HTML }), [])

  useEffect(() => {
    if (!username) {
      setUOk(null)
      setUErr('Kullanıcı adı zorunludur.')
      return
    }
    const uname = username.toLowerCase().trim()
    const valid = /^[a-z0-9_]{3,20}$/.test(uname)
    if (!valid) {
      setUOk(false)
      setUErr('3–20 karakter, sadece küçük harf, rakam ve alt çizgi kullanılabilir.')
      return
    }
    let abort = false
    setULoading(true)
    setUErr(null)
    const ac = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/check?username=${encodeURIComponent(uname)}`, { cache: 'no-store', signal: ac.signal })
        const j = await res.json()
        if (abort) return
        if (!res.ok || !j?.ok) {
          setUOk(false)
          setUErr(j?.message || 'Kontrol sırasında bir hata oluştu.')
        } else {
          setUOk(Boolean(j.available))
          setUErr(j.available ? null : 'Bu kullanıcı adı alınmış.')
        }
      } catch {
        if (!abort) {
          setUOk(false)
          setUErr('Ağ hatası: kontrol edilemedi.')
        }
      } finally {
        if (!abort) setULoading(false)
      }
    }, 300)
    return () => {
      abort = true
      ac.abort()
      clearTimeout(t)
    }
  }, [username])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    // basic email validation + common TLD typo guard
    const em = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
    const tldTypo = /(\.(cmo|con|clm))$/i
    if (!emailRegex.test(em) || tldTypo.test(em)) {
      setErr('E‑posta adresi geçersiz görünüyor. Yazım hatası olabilir (örn. ".com" yerine ".clm"). Lütfen kontrol edin.')
      return
    }
    if (!agreeKvkk || !agreeTerms) {
      setErr('Kayıt için “Kullanım Koşulları” ve “Kişisel Veriler Kanunu” metinlerini onaylamanız gerekir.')
      return
    }
    const uname = username.toLowerCase().trim()
    if (!uname || uLoading || uOk === false) {
      setErr('Geçerli ve benzersiz bir kullanıcı adı seçmelisiniz.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: em, password, username: uname, captchaToken }),
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
          <label className="block text-sm font-medium mb-1">Kullanıcı adı</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            pattern="[a-z0-9_]{3,20}"
            title="3–20 karakter, sadece küçük harf, rakam ve alt çizgi."
            onInvalid={(e) => {
              e.currentTarget.setCustomValidity('Geçerli bir kullanıcı adı girin (küçük harf, rakam, alt çizgi; 3–20).')
            }}
            onInput={(e) => e.currentTarget.setCustomValidity('')}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            placeholder="Kullanıcı Adı"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
          />
          <div className="mt-1 text-xs">
            {uLoading ? <span className="text-gray-600">Kontrol ediliyor…</span> : uErr ? <span className="text-red-600">{uErr}</span> : uOk ? <span className="text-green-600">Kullanılabilir.</span> : null}
          </div>
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

        <Recaptcha onVerify={(t) => setCaptchaToken(t)} />

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
          <div className="rounded-xl border border-green-200 bg-green-50 text-green-800 px-4 py-3 text-sm">
            <div>
              Kayıt başarılı! E‑posta doğrulama bağlantısı gönderildi. Lütfen gelen kutunu kontrol et ve doğruladıktan sonra giriş yap.
            </div>
            <div className="mt-2">
              <Link href="/" className="inline-flex items-center gap-1 rounded-lg border border-green-300 bg-white/60 px-3 py-1 text-green-800 hover:bg-white">
                Doğrulamadan devam et
              </Link>
            </div>
          </div>
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

      {openKvkk && (
        <Modal open={openKvkk} onClose={() => setOpenKvkk(false)} title="Kişisel Veriler Kanunu (KVKK)">
          <article className="legal-content text-sm leading-relaxed text-gray-800" dangerouslySetInnerHTML={kvkkHTML} />
        </Modal>
      )}

      {openTerms && (
        <Modal open={openTerms} onClose={() => setOpenTerms(false)} title="Kullanım Koşulları">
        <article className="legal-content text-sm leading-relaxed text-gray-800" dangerouslySetInnerHTML={termsHTML} />
        </Modal>
      )}
    </div>
  )
}

// basit reCAPTCHA v2 bileşeni
function Captcha({ onVerify }: { onVerify: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''
  const enabled = (process.env.NEXT_PUBLIC_RECAPTCHA_ENABLED || '1') !== '0'
  useEffect(() => {
    if (!enabled || !siteKey) { onVerify('dev'); return }
    const id = 'recaptcha-script'
    if (!document.getElementById(id)) {
      const s = document.createElement('script')
      s.src = 'https://www.google.com/recaptcha/api.js'
      s.async = true
      s.defer = true
      s.id = id
      document.body.appendChild(s)
    }
    ;(window as any).onRecaptcha = (token: string) => onVerify(token)
    return () => { /* noop */ }
  }, [])
  if (!enabled || !siteKey) return null
  return (
    <div className="pt-2">
      <div className="g-recaptcha" data-sitekey={siteKey} data-callback="onRecaptcha" />
    </div>
  )
}
