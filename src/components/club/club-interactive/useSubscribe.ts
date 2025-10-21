// src/components/club/club-interactive/useSubscribe.ts
import type { Initial, Pending } from './types'

type Args = {
  initial: Initial
  profile: { city: string; district: string; phone: string }
  profileMissing: boolean
  contractChecked: boolean
  soldOut: boolean
  readPending: () => Pending
  resumePending: (p: Pending) => void
  setPending: (p: Pending) => void
  setBusy: (v: boolean) => void
  setUiError: (v: string | null) => void
  setPaytrUrl: (v: string | null) => void
  setPaytrOpen: (v: boolean) => void
  pendingKey: string
}

export function useSubscribe(args: Args) {
  return async function onSubscribe() {
    const { initial, profile, profileMissing, contractChecked, soldOut } = args
    if ((window as any).__sub_busy) return
    args.setUiError(null)
    if (soldOut) {
      args.setUiError('Kontenjan dolu. Bu kulüp şu an yeni abonelik kabul etmiyor.')
      return
    }
    if (!initial.me.id) {
      const cb = `/clubs/${initial.club.slug}#subscribe`
      window.location.href = `/login?callbackUrl=${encodeURIComponent(cb)}`
      return
    }
    if (profileMissing) {
      const ev = new CustomEvent('openProfileModal')
      window.dispatchEvent(ev)
      return
    }
    if (!contractChecked) {
      args.setUiError('Lütfen Mesafeli Satış Sözleşmesini okuyup onay kutucuğunu işaretleyin.')
      return
    }
    const existing = args.readPending()
    if (existing) {
      args.setPending(existing)
      args.resumePending(existing)
      return
    }

    ;(window as any).__sub_busy = true
    args.setBusy(true)
    try {
      const res = await fetch('/api/paytr/get-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: initial.me.email,
          userName: initial.me.name || 'Abone',
          userAddress: `${profile.district || ''} ${profile.city || 'Türkiye'}`.trim(),
          userPhone: profile.phone || '0000000000',
          amount: initial.club.priceTRY,
          clubId: initial.club.id,
          clubName: initial.club.name,
          redirectSlug: `clubs/${initial.club.slug}`,
        }),
      })
      const ctype = res.headers.get('content-type') || ''
      if (!ctype.includes('application/json')) {
        throw new Error('Bekleyen abonelik işleminiz olabilir. Mevcut ödemeyi tamamlayın veya 30 dk sonra yeniden deneyin.')
      }
      const data = await res.json()
      if (!res.ok || !data?.iframe_url) throw new Error(data?.error || 'Ödeme başlatılamadı')

      try {
        const p: Pending = { merchant_oid: data.merchant_oid, iframe_url: data.iframe_url, createdAt: Date.now() }
        localStorage.setItem(args.pendingKey, JSON.stringify(p))
        args.setPending(p)
      } catch {}
      args.setPaytrUrl(data.iframe_url)
      args.setPaytrOpen(true)
    } catch (e: any) {
      args.setUiError(e?.message || 'Ödeme başlatılamadı. Lütfen tekrar deneyin.')
    } finally {
      args.setBusy(false)
      ;(window as any).__sub_busy = false
    }
  }
}
