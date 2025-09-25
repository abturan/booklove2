// src/app/feed/embed/page.tsx
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import InfiniteFeed from '@/components/feed/InfiniteFeed'

function EmbedInner() {
  const sp = useSearchParams()
  const scope = (sp.get('scope') as 'friends' | 'self' | null) ?? 'friends'
  return (
    <div className="space-y-4">
      <InfiniteFeed scope={scope} />
    </div>
  )
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Yükleniyor…</div>}>
      <EmbedInner />
    </Suspense>
  )
}
