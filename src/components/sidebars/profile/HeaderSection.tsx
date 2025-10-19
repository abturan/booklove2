// src/components/sidebars/profile/HeaderSection.tsx
import Avatar from '@/components/Avatar'
export default function HeaderSection({
  avatarUrl, name, username, children,
}: { avatarUrl: string|null|undefined; name: string|null; username: string|null; children?: React.ReactNode }) {
  return (
    <section>
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <Avatar src={avatarUrl ?? null} size={72} alt={name || username || 'Profil'} className="ring-4 ring-white shadow-xl" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold leading-tight break-words">{name ?? ''}</h1>
            {username && <p className="text-sm text-gray-600 leading-snug break-all">@{username}</p>}
            {children && <div className="mt-3 flex sm:justify-end">{children}</div>}
          </div>
        </div>
      </div>
    </section>
  )
}
