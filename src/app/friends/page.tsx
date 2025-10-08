// src/app/friends/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'
import LeftSidebar from '@/components/sidebars/LeftSidebar'
import ProfileBanner from '@/components/profile/ProfileBanner'
import IncomingItem from '@/components/friends/IncomingItem'

export const dynamic = 'force-dynamic'

export default async function FriendsPage() {
  const session = await auth()
  if (!session?.user?.id) return <div className="p-6">Lütfen giriş yapın.</div>
  const meId = session.user.id

  const me = await prisma.user.findUnique({
    where: { id: meId },
    select: { bannerUrl: true },
  })

  const [pendingIn, pendingOut, accepted] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { toId: meId, status: 'PENDING', respondedAt: null },
      include: { from: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.friendRequest.findMany({
      where: { fromId: meId, status: 'PENDING' },
      include: { to: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.friendRequest.findMany({
      where: { status: 'ACCEPTED', OR: [{ fromId: meId }, { toId: meId }] },
      include: {
        from: { select: { id: true, name: true, username: true, avatarUrl: true } },
        to: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <ProfileBanner src={me?.bannerUrl} canEdit />

      <div className="grid lg:grid-cols-3 gap-6">
        <div>
          <LeftSidebar />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-4">
            <h1 className="text-lg font-semibold mb-2">Book Buddy</h1>
            {accepted.length === 0 ? (
              <div className="text-sm text-gray-600">Henüz Book Buddy’in yok.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {accepted.map((fr) => {
                  const other = fr.from.id === meId ? fr.to : fr.from
                  return (
                    <li key={fr.id} className="py-3 flex items-center gap-3">
                      <Link href={userPath(other.username, other.name)} className="flex items-center gap-3">
                        <Avatar src={other.avatarUrl ?? null} size={40} alt={other.name || 'Kullanıcı'} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{other.name || 'Kullanıcı'}</div>
                          <div className="text-xs text-gray-600 truncate">{other.username ? `@${other.username}` : ''}</div>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="card p-4">
            <h2 className="font-semibold mb-2">Gelen istekler</h2>
            {pendingIn.length === 0 ? (
              <div className="text-sm text-gray-600">Bekleyen istek yok.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {pendingIn.map((fr) => (
                  <IncomingItem key={fr.id} requestId={fr.id} user={fr.from} />
                ))}
              </ul>
            )}
          </div>

          <div className="card p-4">
            <h2 className="font-semibold mb-2">Gönderilen istekler</h2>
            {pendingOut.length === 0 ? (
              <div className="text-sm text-gray-600">Bekleyen isteğiniz yok.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {pendingOut.map((fr) => {
                  const u = fr.to
                  return (
                    <li key={fr.id} className="py-3 flex items-center gap-3">
                      <Link href={userPath(u.username, u.name)} className="flex items-center gap-3">
                        <Avatar src={u.avatarUrl ?? null} size={36} alt={u.name || 'Kullanıcı'} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{u.name || 'Kullanıcı'}</div>
                          <div className="text-xs text-gray-600 truncate">{u.username ? `@${u.username}` : ''}</div>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}