// src/components/sidebars/PublicProfileSidebar.tsx
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import Avatar from '@/components/Avatar'
import RequestButton from '@/components/friends/RequestButton'

export default async function PublicProfileSidebar({ userId }: { userId: string }) {
  const session = await auth()
  const meId = session?.user?.id || null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, username: true, avatarUrl: true,
      Memberships: {
        where: { isActive: true },
        include: { club: { select: { slug: true, name: true, bannerUrl: true } } }
      },
    },
  })
  if (!user) return null

  let isFriend = false
  let showSentFromMe = false
  let showInfoFromThemPending = false
  let showInfoFromThemDeclinedByMe = false
  let canSendFromMe = false

  if (meId && meId !== user.id) {
    const pairs = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { fromId: meId, toId: user.id },
          { fromId: user.id, toId: meId },
        ],
      },
      select: { fromId: true, toId: true, status: true, respondedAt: true },
      orderBy: { createdAt: 'desc' },
    })

    isFriend = pairs.some(p => p.status === 'ACCEPTED')
    const mine = pairs.find(p => p.fromId === meId && p.toId === user.id)
    const theirs = pairs.find(p => p.fromId === user.id && p.toId === meId)

    if (!isFriend) {
      if (mine) {
        if (mine.status === 'PENDING') {
          showSentFromMe = true
        }
      } else if (theirs) {
        if (theirs.status === 'PENDING' && !theirs.respondedAt) {
          showInfoFromThemPending = true
        } else if (theirs.status === 'PENDING' && theirs.respondedAt) {
          showInfoFromThemDeclinedByMe = true
          canSendFromMe = true
        }
      } else {
        canSendFromMe = true
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <Avatar src={user.avatarUrl ?? null} size={48} alt={user.name || user.username || 'Profil'} />
          <div className="min-w-0">
            <div className="font-medium truncate">{user.name ?? ''}</div>
            <div className="text-sm text-gray-600 truncate">{user.username ? `@${user.username}` : ''}</div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h4 className="font-semibold mb-2">Kulüpler</h4>
        <div className="space-y-3">
          {user.Memberships.length === 0 && <div className="text-sm text-gray-600">Hiç kulüp yok.</div>}
          {user.Memberships.map((m) => (
            <Link key={m.club.slug} href={`/clubs/${m.club.slug}`} className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden ring-1 ring-black/5 bg-gray-100">
                <Image
                  src={
                    m.club.bannerUrl ||
                    'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop'
                  }
                  alt=""
                  fill
                  className="object-cover group-hover:scale-[1.02] transition"
                />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{m.club.name}</div>
                <div className="text-xs text-gray-600 truncate">Kulüp sayfasına git →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card p-4 space-y-2">
        {!meId || meId === user.id ? null : isFriend ? (
          <>
            <div className="text-sm font-medium text-green-700">Arkadaşsınız ✔︎</div>
            <Link href={`/messages/${user.id}`} className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm inline-flex">
              Mesaj gönder
            </Link>
          </>
        ) : showSentFromMe ? (
          <RequestButton toUserId={user.id} initialState="sent" />
        ) : showInfoFromThemPending ? (
          <div className="text-sm text-gray-600">Bu kullanıcı size istek gönderdi.</div>
        ) : showInfoFromThemDeclinedByMe ? (
          <div className="space-y-2">
            <div className="text-sm text-gray-700">
              Bu kullanıcı size istek gönderdi ve <b>siz reddettiniz</b>. Eğer bağlantı kurmak istiyorsanız
              siz ona istek gönderebilirsiniz.
            </div>
            <RequestButton toUserId={user.id} initialState="idle" />
          </div>
        ) : canSendFromMe ? (
          <RequestButton toUserId={user.id} initialState="idle" />
        ) : null}
      </div>

      <div className="card p-4 text-sm text-gray-600">
        Yorum yapmak için arkadaş olun. Arkadaşlık isteği kabul edilince yorum yazabilirsiniz.
      </div>
    </div>
  )
}
