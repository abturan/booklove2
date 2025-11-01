'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ProfileMessageButton({ userId }: { userId: string }) {
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function openThread() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/dm/open?peerId=${encodeURIComponent(userId)}`, { cache: 'no-store' })
      const j = await res.json().catch(() => null)
      if (res.ok && j?.threadId) {
        router.push(`/messages/${j.threadId}`)
        router.refresh()
        window.dispatchEvent(new CustomEvent('dm:changed'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={openThread}
      disabled={busy}
      className="inline-flex items-center justify-center rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60 sm:px-4"
      aria-label="Mesaj gönder"
    >
      <svg
        className="sm:mr-2"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M4 5h16v11H8l-4 4z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="hidden sm:inline">{busy ? 'Açılıyor…' : 'Mesaj gönder'}</span>
    </button>
  )
}
