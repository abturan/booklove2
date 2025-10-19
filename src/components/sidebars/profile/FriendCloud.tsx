// src/components/sidebars/profile/FriendCloud.tsx
import Link from 'next/link'
import Image from 'next/image'
import { userPath } from '@/lib/userPath'

type MiniUser = {
  id: string
  username: string | null
  slug: string | null
  avatarUrl: string | null
  name: string | null
}

export default function FriendCloud({ users }: { users: MiniUser[] }) {
  if (!users?.length) return null

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Arkadaşlar</h3>
        <span className="text-xs text-gray-500">{users.length}</span>
      </div>

      <div className="mt-3 grid grid-cols-8 gap-2">
        {users.slice(0, 24).map((u) => {
          // Linki her zaman ortak util ile üret (slug > username > slugify(name))
          const href =
            u.slug || u.username || u.name ? userPath(u.username, u.name, u.slug) : null

          const avatar = u.avatarUrl ? (
            <Image src={u.avatarUrl} alt="" fill className="object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center text-xs text-gray-400">🙂</div>
          )

          const content = (
            <div
              className="relative h-9 w-9 rounded-full ring-1 ring-black/5 overflow-hidden bg-gray-100"
              title={u.name || u.username || ''}
            >
              {avatar}
            </div>
          )

          return href ? (
            <Link key={u.id} href={href} className="block">
              {content}
            </Link>
          ) : (
            <div key={u.id} className="block opacity-70 cursor-default">
              {content}
            </div>
          )
        })}
      </div>
    </section>
  )
}
