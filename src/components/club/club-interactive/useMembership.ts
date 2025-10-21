// src/components/club/club-interactive/useMembership.ts
import { useEffect, useState } from 'react'

type Args = {
  clubId: string
  initialIsMember: boolean
  initialMemberSince: string | null
  initialMemberCount: number
  pendingKey: string
  paidOk: boolean
  setPaytrOpen: (v: boolean) => void
  setPaytrUrl: (v: string | null) => void
  setUiError: (v: string | null) => void
}

export function useMembership(args: Args) {
  const [isMember, setIsMember] = useState(args.initialIsMember)
  const [memberSince, setMemberSince] = useState<string | null>(args.initialMemberSince)
  const [memberCount, setMemberCount] = useState(args.initialMemberCount)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function refresh(reason: 'payment-ok' | 'not-member') {
      try {
        const res = await fetch(`/api/me/is-member?clubId=${args.clubId}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data?.isMember) {
          try {
            const raw = localStorage.getItem(args.pendingKey)
            if (raw) {
              const p = JSON.parse(raw)
              if (p?.merchant_oid) sessionStorage.removeItem(`paytr_iframe_${p.merchant_oid}`)
            }
            localStorage.removeItem(args.pendingKey)
          } catch {}
          setIsMember(true)
          setMemberSince(data.memberSince ?? null)
          if (reason === 'payment-ok') setMemberCount((c) => Math.max(c + 1, c))
          args.setPaytrOpen(false)
          args.setPaytrUrl(null)
          args.setUiError(null)
        }
      } catch {}
    }
    if (args.paidOk) refresh('payment-ok')
    else if (!isMember) refresh('not-member')
    return () => {
      cancelled = true
    }
  }, [args.clubId, args.paidOk, args.pendingKey, isMember, args.setPaytrOpen, args.setPaytrUrl, args.setUiError])

  return { isMember, memberSince, memberCount, setMemberCount, busy, setBusy }
}
