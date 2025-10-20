// src/components/header/AuthButtons.tsx
'use client'

import Link from 'next/link'

export default function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="inline-flex h-9 items-center rounded-full bg-gray-900 px-4 text-sm font-semibold text-white whitespace-nowrap">
        Giriş yap
      </Link>
      <Link href="/register" className="inline-flex h-9 items-center rounded-full bg-rose-600 px-4 text-sm font-semibold text-white whitespace-nowrap">
        Kayıt ol
      </Link>
    </div>
  )
}
