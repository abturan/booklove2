// src/components/feed/post/RebookListModal.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

type Entry = {
  id: string
  body: string | null
  createdAt: string
  owner: { id: string; name: string | null; username: string | null; slug: string | null; avatarUrl: string | null }
}

export default function RebookListModal({ postId }: { postId: string }) {
  const [items, setItems] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/posts/${postId}/rebooks`, { cache: 'no-store' })
        const j = await res.json()
        if (!alive) return
        if (Array.isArray(j?.items)) setItems(j.items)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [postId])

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="text-sm text-gray-600">Yükleniyor…</div>
      ) : items.length === 0 ? (
        <div className="py-4 text-sm text-gray-600">Henüz Rebookie yapılmadı.</div>
      ) : (
        items.map((entry) => {
          const dateLabel = new Date(entry.createdAt).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
          const preview = (entry.body || '').trim() || 'Metin yok'
          return (
            <div key={entry.id} className="flex items-start gap-3 rounded-2xl border border-gray-100 p-3">
              <Link href={userPath(entry.owner?.username ?? undefined, entry.owner?.name ?? undefined, entry.owner?.slug ?? undefined)}>
                <Avatar src={entry.owner?.avatarUrl || undefined} size={40} alt={entry.owner?.name || 'Kullanıcı'} />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Link href={userPath(entry.owner?.username ?? undefined, entry.owner?.name ?? undefined, entry.owner?.slug ?? undefined)} className="truncate hover:underline">
                    {entry.owner?.name || 'Kullanıcı'}
                  </Link>
                  <span className="text-[11px] font-normal text-gray-500">{dateLabel}</span>
                </div>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {preview}
                </p>
                <Link
                  href={`/?focus=${entry.id}`}
                  className="mt-1 inline-flex text-xs font-medium text-[#fa3d30] hover:underline"
                >
                  Gönderiyi aç
                </Link>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
