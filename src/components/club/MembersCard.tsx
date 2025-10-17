// src/components/club/MembersCard.tsx
'use client'

import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

type Member = { id: string; name: string; username?: string | null; avatarUrl: string | null }

export default function MembersCard({ members, total }: { members: Member[]; total: number }) {
  const preview = members.slice(0, 30)
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">Üyeler</div>
        <div className="text-sm text-gray-600">Toplam: {total}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        {preview.map((m) => (
          <div key={m.id} className="relative group">
            <Link href={userPath(m.username, m.name)} className="block">
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
