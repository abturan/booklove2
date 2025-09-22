// src/app/paytr/fail/FailInner.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function FailInner() {
  const r = useRouter()
  const q = useSearchParams()

  useEffect(() => {
    const oid = q.get('oid') || ''

    // iFrame URL cache + pending kayıt temizliği (başarısızlıkta da sil)
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
    r.replace(to + '?payment=fail')
  }, [q, r])

  return <div>Yönlendiriliyorsunuz…</div>
}
