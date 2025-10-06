// src/app/paytr/ok/OkInner.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function OkInner() {
  const r = useRouter()
  const q = useSearchParams()

  useEffect(() => {
    const run = async () => {
      const oid = q.get('oid') || ''
      try {
        if (oid) sessionStorage.removeItem(`paytr_iframe_${oid}`)
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || ''
          if (!k.startsWith('paytr_pending_')) continue
          const v = localStorage.getItem(k)
          if (!v) continue
          try {
            const o = JSON.parse(v)
            if (o?.merchant_oid === oid) localStorage.removeItem(k)
          } catch {}
        }
      } catch {}

      const to = q.get('to') || '/'
      if (to.startsWith('/clubs/')) {
        const slug = to.split('/')[2] || ''
        if (slug) {
          try {
            await fetch('/api/subscriptions/activate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clubSlug: slug }),
              cache: 'no-store',
            })
          } catch {}
        }
      }
      r.replace(to + '?payment=ok')
    }
    run()
  }, [q, r])

  return <div>Yönlendiriliyorsunuz…</div>
}
