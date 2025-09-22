// src/app/paytr/fail/page.tsx
import { Suspense } from 'react'
import FailInner from './FailInner'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function FailPage() {
  return (
    <Suspense fallback={<div>Yönlendiriliyorsunuz…</div>}>
      <FailInner />
    </Suspense>
  )
}
