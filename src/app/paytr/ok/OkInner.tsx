'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function OkInner() {
  const r = useRouter()
  const q = useSearchParams()

  useEffect(() => {
    const run = async () => {
      const oid = q.get('oid') || ''

      // Ödeme iFrame/pending temizliği
      try {
        if (oid) sessionStorage.removeItem(`paytr_iframe_${oid}`)
        for (let i = localStorage.length - 1; i >= 0; i--) {
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
      setTimeout(() => {
        r.replace(to + '?payment=ok')
      }, 700)
    }
    run()
  }, [q, r])

  return (
    <div className="min-h-[60vh] grid place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-5 w-5 rounded-full border-2 border-gray-300 border-t-gray-800" />
          <div className="font-medium">Ödemeniz alındı, yönlendiriliyoruz…</div>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Bu pencere otomatik kapanmazsa tarayıcınızın “geri” tuşunu kullanabilir
          veya sekmeyi kapatabilirsiniz.
        </p>
      </div>
    </div>
  )
}
