// src/components/admin/AdminSummary.tsx
'use client'
import { useEffect, useState } from 'react'

type Metrics = {
  users: { total: number }
  clubs: { active: number, total: number }
  subscribers: { paid: number }
  revenue: { totalKurus: number, totalTRY: number }
}

const nfTL = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })

export default function AdminSummary() {
  const [m, setM] = useState<Metrics | null>(null)

  useEffect(() => {
    let ok = true
    ;(async () => {
      const r = await fetch('/api/admin/metrics', { cache: 'no-store' })
      const j = await r.json()
      if (ok) setM(j)
    })()
    return () => { ok = false }
  }, [])

  if (!m) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat title="Toplam Üye" value={m.users.total.toLocaleString('tr-TR')} />
      <Stat title="Kulüp (aktif)" value={`${m.clubs.active} / ${m.clubs.total}`} />
      <Stat title="Ücretli Abone" value={m.subscribers.paid.toLocaleString('tr-TR')} />
      <Stat title="Toplam Ciro" value={nfTL.format(m.revenue.totalTRY)} />
    </div>
  )
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border p-4 bg-white/70">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}
