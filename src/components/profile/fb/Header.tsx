// src/components/profile/fb/Header.tsx
import Avatar from './LocalAvatar'

function FriendsStrip({ list = [] as any[] }) {
  if (!list.length) return null
  return (
    <div className="flex -space-x-2">
      {list.map((f) => (
        <div
          key={f.id}
          className="h-8 w-8 rounded-full ring-2 ring-[#1f1f1f] overflow-hidden bg-gray-200"
          title={f.name}
        >
          <Avatar src={f.avatarUrl} alt={f.name} size={32} />
        </div>
      ))}
    </div>
  )
}

export default function Header({
  user,
}: {
  // data.ts dönen tip
  user: {
    id: string
    name?: string | null
    username?: string | null
    avatarUrl?: string | null
    bannerUrl?: string | null
    bio?: string | null
    friendsCount?: number
    friendsPreview?: { id: string; name?: string | null; avatarUrl?: string | null }[]
  }
}) {
  const friendsCount = user.friendsCount ?? 0
  const friendsPreview = user.friendsPreview ?? []

  return (
    <section className="mb-3">
      {/* Kapak */}
      <div className="relative h-40 w-full bg-[#1f1f1f]">
        <img
          src={
            user.bannerUrl ||
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop'
          }
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      {/* Koyu profil bloğu */}
      <div className="-mt-12 px-4">
        <div className="rounded-2xl bg-[#1f1f1f] text-white p-4 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="relative h-28 w-28 rounded-full ring-4 ring-[#1f1f1f] -mt-10 overflow-hidden">
              <Avatar
                src={user.avatarUrl}
                size={112}
                alt={user.name || user.username || 'Profil'}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-[28px] font-extrabold leading-7 truncate">
                {user.name || user.username}
              </h1>
              <div className="text-gray-300 text-[15px]">
                {Intl.NumberFormat('tr-TR').format(friendsCount)} arkadaş
              </div>
              <div className="mt-2">
                <FriendsStrip list={friendsPreview} />
              </div>
            </div>

            <div className="grid gap-2">
              <button className="h-10 rounded-lg bg-primary px-4 font-semibold">
                Mesaj Gönder
              </button>
              <button className="h-10 rounded-lg bg-[#303030] px-4">
                Arkadaşlar
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
