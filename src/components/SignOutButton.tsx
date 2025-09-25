// src/components/SignOutButton.tsx
// Tekrarlı “Çıkış yap” butonu. Sol panel vb. yerlerde yeniden kullanılır.
'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'

export default function SignOutButton() {
  const [busy, setBusy] = useState(false)

  async function doOut() {
    if (busy) return
    setBusy(true)
    try {
      await signOut({ callbackUrl: '/' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={doOut}
      disabled={busy}
      className="px-4 py-2 rounded-2xl bg-gray-900 text-white text-sm disabled:opacity-60"
    >
      {busy ? 'Çıkış yapılıyor…' : 'Çıkış yap'}
    </button>
  )
}
