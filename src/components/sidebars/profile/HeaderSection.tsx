// src/components/sidebars/profile/HeaderSection.tsx
import Image from 'next/image'
import clsx from 'clsx'

export default function HeaderSection({
  name,
  username,
  avatarUrl,
  showAvatar = true,
  children,
  className,
}: {
  name?: string | null
  username?: string | null
  avatarUrl?: string | null
  showAvatar?: boolean
  children?: React.ReactNode
  className?: string
}) {
  const hasAvatar = !!(avatarUrl && avatarUrl.trim().length > 0)

  return (
    <section className={clsx('rounded-3xl bg-white/80 backdrop-blur p-5 shadow-soft ring-1 ring-black/5 flex items-center gap-4', className)}>
      {showAvatar && hasAvatar && (
        <div className="relative shrink-0">
          <Image src={avatarUrl as string} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover ring-4 ring-white shadow" />
        </div>
      )}

      <div className="min-w-0">
        <div className="text-xl font-extrabold leading-tight break-words">{name || '—'}</div>
        {username && <div className="text-sm text-gray-500 break-words">@{username}</div>}
      </div>

      {children ? <div className="ml-auto">{children}</div> : null}
    </section>
  )
}
