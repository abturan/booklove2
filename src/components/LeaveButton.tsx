'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LeaveButton({ clubId }: { clubId: string }) {
  const r = useRouter()
  const [loading, setLoading] = useState(false)

  async function leave() {
    setLoading(true)
    const res = await fetch(`/api/clubs/${clubId}/leave`, { method: 'POST' })
    setLoading(false)
    if (res.ok) r.refresh()
  }

  return (
    <button
      onClick={leave}
      disabled={loading}
      className="px-3 py-1.5 rounded-full bg-gray-200 text-gray-900 text-sm disabled:opacity-60"
    >
      {loading ? 'Çıkılıyor…' : 'Ayrıl'}
    </button>
  )
}
