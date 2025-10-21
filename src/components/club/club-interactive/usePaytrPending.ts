// src/components/club/club-interactive/usePaytrPending.ts
import { useCallback, useEffect, useState } from 'react'
import type { Pending } from './types'

export function usePaytrPending(pendingKey: string) {
  const [paytrOpen, setPaytrOpen] = useState(false)
  const [paytrUrl, setPaytrUrl] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [uiError, setUiError] = useState<string | null>(null)

  const readPending = useCallback((): Pending => {
    try {
      const raw = localStorage.getItem(pendingKey)
      if (!raw) return null
      const p = JSON.parse(raw)
      const fresh = Date.now() - (p?.createdAt || 0) < 30 * 60 * 1000
      if (p?.iframe_url && fresh) return p
      localStorage.removeItem(pendingKey)
      return null
    } catch {
      return null
    }
  }, [pendingKey])

  const clearPending = useCallback((p?: Pending) => {
    try {
      const oid = p?.merchant_oid
      if (oid) sessionStorage.removeItem(`paytr_iframe_${oid}`)
      localStorage.removeItem(pendingKey)
    } catch {}
    setPending(null)
  }, [pendingKey])

  const resumePending = useCallback((p: Pending) => {
    if (!p?.iframe_url) return
    setPaytrUrl(p.iframe_url)
    setPaytrOpen(true)
    setUiError('Bekleyen abonelik işleminizi tekrar açtık. Ödemeyi tamamlayın veya kapatın.')
  }, [])

  useEffect(() => {
    setPending(readPending())
  }, [readPending])

  return {
    pending,
    setPending,
    readPending,
    clearPending,
    resumePending,
    paytrOpen,
    setPaytrOpen,
    paytrUrl,
    setPaytrUrl,
    uiError,
    setUiError,
  }
}
