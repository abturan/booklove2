// src/components/MembersCloud.tsx
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

type U = { id: string; name: string | null; avatarUrl: string | null; username?: string | null }

export default function MembersCloud({ users, total }: { users: U[]; total: number }) {
  if (!users.length) return null

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500">Üyeler</div>
        <div className="text-sm text-gray-600">Toplam: {total}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {users.slice(0, 30).map((u, i) => (
          <div key={u.id} className="relative group" style={{ transform: `translateY(${(i % 5) * 2 - 4}px)` }}>
            <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-gray-900 text-white text-xs px-2 py-1 rounded-full">
              {u.name || 'Üye'}
              <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-900 rounded-sm" />
            </div>
            <Link href={userPath(u.username, u.name)} className="relative w-10 h-10 rounded-full ring-2 ring-white shadow overflow-hidden block">
              <Avatar src={u.avatarUrl ?? null} size={40} alt={u.name || 'Üye'} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
