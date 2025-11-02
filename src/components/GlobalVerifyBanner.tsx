// src/components/GlobalVerifyBanner.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'

export default function GlobalVerifyBanner() {
  const [visible, setVisible] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function load() {
    try {
      const r = await fetch('/api/me/verify-status', { cache: 'no-store' })
      const j = await r.json().catch(() => null)
      setVisible(Boolean(j?.authenticated && j?.verified === false))
    } catch {
      setVisible(false)
    }
  }

  React.useEffect(() => {
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  async function resend() {
    setSending(true); setError(null)
    try {
      const r = await fetch('/api/auth/verify-email/resend', { method: 'POST' })
      const j = await r.json().catch(() => null)
      if (!r.ok || j?.ok !== true) throw new Error(j?.error || 'Gönderilemedi')
      setSent(true)
    } catch (e: any) {
      setError(e?.message || 'Gönderilemedi')
    } finally { setSending(false) }
  }

  if (!visible) return null
  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-800">
      <div className="container mx-auto px-4 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <span className="font-medium">Tüm özelliklerden faydalanmak için e‑postanızı doğrulayın.</span>
        <button
          type="button"
          onClick={resend}
          disabled={sending || sent}
          className="rounded-full border border-amber-300 bg-white px-3 py-1 text-sm hover:bg-amber-100 disabled:opacity-60 w-full sm:w-auto"
        >
          {sent ? 'Gönderildi' : (sending ? 'Gönderiliyor…' : 'Doğrulama linkini yeniden gönder')}
        </button>
        <Link
          href="/profile/settings"
          className="rounded-full border border-amber-300 bg-white px-3 py-1 text-sm hover:bg-amber-100 w-full sm:w-auto text-center"
        >
          E‑posta adresimi değiştir
        </Link>
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </div>
  )
}
