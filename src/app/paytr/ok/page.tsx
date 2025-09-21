// src/app/paytr/ok/page.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function OkPage() {
  const r = useRouter()
  const q = useSearchParams()
  useEffect(() => {
    const to = q.get('to') || '/'
    r.replace(to + '?payment=ok')
  }, [])
  return <div>Yönlendiriliyorsunuz…</div>
}

// src/app/paytr/fail/page.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function FailPage() {
  const r = useRouter()
  const q = useSearchParams()
  useEffect(() => {
    const to = q.get('to') || '/'
    r.replace(to + '?payment=fail')
  }, [])
  return <div>Yönlendiriliyorsunuz…</div>
}
