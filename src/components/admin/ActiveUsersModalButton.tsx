'use client'

import * as React from 'react'
import Modal from '@/components/ui/modal'
import Avatar from '@/components/Avatar'
import Link from 'next/link'

type Row = { id: string; name: string | null; username: string | null; slug: string | null; avatarUrl: string | null; lastSeenAt?: string }

export default function ActiveUsersModalButton() {
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState<Row[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/admin/online-users', { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'Yüklenemedi')
      const rows: Row[] = Array.isArray(j.items)
        ? j.items.map((u: any) => ({ ...u, lastSeenAt: u.lastSeenAt ? String(u.lastSeenAt) : undefined }))
        : []
      setItems(rows)
    } catch (e: any) {
      setError(e?.message || 'Yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); void load() }}
        className="rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Aktif kullanıcıları görüntüle
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Aktif kullanıcılar">
        {loading && <div className="text-sm text-gray-600">Yükleniyor…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && !error && (
          <ul className="max-h-[70vh] overflow-auto divide-y">
            {items.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2">
                <Avatar src={u.avatarUrl ?? null} size={40} alt={u.name || 'Kullanıcı'} />
                <div className="min-w-0">
                  <div className="truncate font-medium text-sm">{u.name || 'Kullanıcı'}</div>
                  <div className="truncate text-xs text-gray-500">@{u.username || u.slug || '—'}</div>
                </div>
                <Link
                  href={`/u/${u.username || u.slug || u.id}`}
                  className="ml-auto rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
                >
                  Profile git
                </Link>
              </li>
            ))}
            {items.length === 0 && (
              <li className="py-3 text-sm text-gray-600">Şu an aktif kullanıcı bulunmuyor.</li>
            )}
          </ul>
        )}
      </Modal>
    </>
  )
}

