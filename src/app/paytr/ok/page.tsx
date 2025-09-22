// src/app/paytr/ok/page.tsx
import { Suspense } from 'react'
import OkInner from './OkInner'

// Bu dosya **server component**; burada Next'in route seçeneklerini set etmek güvenli.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function OkPage() {
  return (
    <Suspense fallback={<div>Yönlendiriliyorsunuz…</div>}>
      <OkInner />
    </Suspense>
  )
}
