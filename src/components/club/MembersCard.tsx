// src/components/club/MembersCard.tsx
'use client'

import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

type Member = { id: string; name: string; username?: string | null; slug?: string | null; avatarUrl: string | null }

type Variant = 'default' | 'drawer'

export default function MembersCard({
  members,
  total,
  variant = 'default',
}: {
  members: Member[]
  total: number
  variant?: Variant
}) {
  if (variant === 'drawer') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-600">Katılımcılar</div>
          <div className="text-xs text-slate-500">Toplam {total}</div>
        </div>
        {members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
            Henüz katılımcı yok.
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={`drawer-${m.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-full overflow-hidden ring-2 ring-white shadow">
                    <Avatar src={m.avatarUrl} size={44} alt={m.name} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{m.name}</div>
                    {m.username && <div className="text-xs text-slate-500 truncate">@{m.username}</div>}
                  </div>
                </div>
                <Link
                  href={userPath(m.username, m.name, m.slug)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Profili gör
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const preview = members.slice(0, 30)
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">Katılımcılar</div>
        <div className="text-sm text-gray-600">Toplam: {total}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        {preview.map((m) => (
          <div key={m.id} className="relative group">
            <Link href={userPath(m.username, m.name, m.slug)} className="block">
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow">
                <Avatar src={m.avatarUrl} size={36} alt={m.name} />
              </div>
            </Link>
            <div className="absolute left-1/2 -translate-x-1/2 -top-8 pointer-events-none opacity-0 group-hover:opacity-100 transition text-xs bg-gray-900 text-white px-2 py-1 rounded-xl whitespace-nowrap">
              {m.name}
            </div>
          </div>
        ))}
        {total > preview.length && <span className="text-xs text-gray-600">+{total - preview.length} daha</span>}
      </div>
    </div>
  )
}
