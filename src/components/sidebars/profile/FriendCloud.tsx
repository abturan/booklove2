// src/components/sidebars/profile/FriendCloud.tsx
import Link from 'next/link'
import { safeAvatarUrl } from '@/lib/avatar'
import { userPath } from '@/lib/userPath'

export default function FriendCloud({
  title = 'Arkadaşlar',
  count = 0,
  friends = [],
}: {
  title?: string
  count?: number
  friends: Array<{ id: string; name: string | null; username: string | null; slug: string | null; avatarUrl: string | null }>
}) {
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
        <span className="text-slate-500 text-base">{count}</span>
      </div>
      <div className="flex -space-x-3 overflow-hidden">
        {friends.slice(0, 12).map((f) => (
          <Link
            key={f.id}
            href={userPath(f.username, f.name, f.slug)}
            className="inline-block ring-2 ring-white rounded-full"
            title={f.name || ''}
          >
            <img
              src={safeAvatarUrl(f.avatarUrl)}
              alt={f.name || 'Avatar'}
              className="w-12 h-12 rounded-full object-cover"
              loading="lazy"
            />
          </Link>
        ))}
      </div>
    </section>
  )
}
