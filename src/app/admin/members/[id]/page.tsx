// src/app/admin/members/[id]/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { assignMemberToClub, adminUpdateUser, deactivateMembership, removeFromClub, cancelSubscriptionAction, adminRequirePasswordReset, adminSendPasswordResetEmail } from '../actions'
import Select from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export const dynamic = 'force-dynamic'

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { msg?: string; err?: string }
}) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  const id = params.id

  const [user, clubs, memberships, subscriptions, counts] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        city: true,
        district: true,
        phone: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        createdAt: true,
        lastSeenAt: true,
      },
    }),
    prisma.club.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        capacity: true,
        events: {
          orderBy: { startsAt: 'desc' },
          select: { id: true, title: true, startsAt: true, capacity: true },
        },
      },
    }),
    prisma.membership.findMany({
      where: { userId: id },
      orderBy: { joinedAt: 'desc' },
      select: {
        id: true,
        clubId: true,
        clubEventId: true,
        isActive: true,
        role: true,
        joinedAt: true,
        club: { select: { id: true, name: true, slug: true, capacity: true } },
        event: { select: { id: true, title: true, startsAt: true } },
      },
    }),
    prisma.subscription.findMany({
      where: { userId: id },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        clubId: true,
        clubEventId: true,
        active: true,
        startedAt: true,
        canceledAt: true,
        club: { select: { id: true, name: true, slug: true } },
        event: { select: { id: true, title: true, startsAt: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            Memberships: true,
            Subscriptions: true,
            posts: true,
            ChatMessage: true,
            comments: true,
            likes: true,
          },
        },
      },
    }),
  ])

  if (!user) redirect('/admin/members')

  const availableClubs = clubs
  const activeEventMemberships = memberships.filter((m) => m.isActive)
  const activeEventSubscriptions = subscriptions.filter((s) => s.active)
  const joinedClubCount = new Set(activeEventMemberships.map((m) => m.clubId)).size

  return (
    <div className="space-y-6">
      {(searchParams?.msg || searchParams?.err) && (
        <div
          role="status"
          aria-live="polite"
          className={
            (searchParams?.err
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800') +
            ' rounded-xl border px-4 py-3'
          }
        >
          {searchParams?.err || searchParams?.msg}
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{user.name || '—'}</h1>
          <div className="text-sm text-gray-600">{user.email}</div>
          {user.username && <div className="text-sm text-gray-600">@{user.username}</div>}
          <div className="mt-2 text-xs text-gray-500">
            Katıldı: {new Date(user.createdAt).toLocaleDateString('tr-TR')}
            {user.lastSeenAt && (
              <> · Son görüldü: {new Date(user.lastSeenAt).toLocaleString('tr-TR')}</>
            )}
          </div>
          <div className="text-xs text-gray-600">
            E‑posta: {user.emailVerifiedAt ? 'Doğrulandı' : 'Doğrulanmadı'} · Telefon: {user.phoneVerifiedAt ? 'Doğrulandı' : 'Doğrulanmadı'}
          </div>
        </div>
        <div className="text-right text-sm text-gray-700 space-y-0.5">
          <div>Aktif etkinlik üyeliği: <span className="font-medium">{activeEventMemberships.length}</span></div>
          <div>Katıldığı kulüp sayısı: <span className="font-medium">{joinedClubCount}</span></div>
          <div>Aktif abonelik: <span className="font-medium">{activeEventSubscriptions.length}</span></div>
          <div>Post: <span className="font-medium">{(counts?._count as any)?.posts ?? 0}</span></div>
          <div>Yorum: <span className="font-medium">{(counts?._count as any)?.comments ?? 0}</span></div>
          <div>Beğeni: <span className="font-medium">{(counts?._count as any)?.likes ?? 0}</span></div>
          <div>Sohbet: <span className="font-medium">{(counts?._count as any)?.ChatMessage ?? 0}</span></div>
        </div>
      </div>

      {/* Profil düzenle */}
      <div className="rounded-2xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Profil Düzenle</h2>
        <form action={adminUpdateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="hidden" name="id" value={user.id} />
          <Input name="name" defaultValue={user.name ?? ''} placeholder="Ad soyad" />
          <Input name="username" defaultValue={user.username ?? ''} placeholder="Kullanıcı adı" />
          <Input name="email" defaultValue={user.email ?? ''} placeholder="E‑posta" />
          <Input name="city" defaultValue={user.city ?? ''} placeholder="Şehir" />
          <Input name="district" defaultValue={user.district ?? ''} placeholder="İlçe" />
          <Input name="phone" defaultValue={user.phone ?? ''} placeholder="Telefon" />
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="emailVerified" defaultChecked={!!user.emailVerifiedAt} /> E‑posta doğrulandı
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="phoneVerified" defaultChecked={!!user.phoneVerifiedAt} /> Telefon doğrulandı
          </label>
          <div className="sm:col-span-2">
            <button className="rounded-xl bg-gray-900 px-4 py-2 text-white">Kaydet</button>
          </div>
        </form>
        <div className="mt-3 space-y-2">
          <form action={adminRequirePasswordReset} className="inline">
            <input type="hidden" name="userId" value={user.id} />
            <button type="submit" className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
              Şifreyi sıfırla (girişte zorunlu)
            </button>
          </form>
          <form action={adminSendPasswordResetEmail} className="inline ml-2">
            <input type="hidden" name="userId" value={user.id} />
            <button type="submit" className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
              Şifre sıfırlama e‑postası gönder
            </button>
          </form>
          {(searchParams?.msg || searchParams?.err) && (
            <div
              role="status"
              aria-live="polite"
              className={
                (searchParams?.err
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800') +
                ' inline-block rounded-xl border px-3 py-1 text-xs ml-2'
              }
            >
              {searchParams?.err || searchParams?.msg}
            </div>
          )}
        </div>
      </div>

      {/* Manuel abonelik/üyelik atama */}
      <div className="rounded-2xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Kulübe abone/üye yap</h2>
        {availableClubs.length === 0 ? (
          <p className="text-sm text-gray-600">Üyenin üye olabileceği etkinlik bulunamadı.</p>
        ) : (
          <form action={assignMemberToClub} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input type="hidden" name="userId" value={user.id} />
            <div className="sm:w-80">
              <Select name="clubEventId" required>
                <option value="">Kulüp ve etkinlik seç</option>
                {availableClubs.map((c) => (
                  <optgroup key={c.id} label={c.name}>
                    {c.events.length === 0 ? (
                      <option value="" disabled>
                        Etkinlik yok
                      </option>
                    ) : (
                      c.events.map((e) => (
                        <option key={e.id} value={e.id}>
                          {new Date(e.startsAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {` · ${e.title}`}
                        </option>
                      ))
                    )}
                  </optgroup>
                ))}
              </Select>
            </div>
            <div className="sm:w-64">
              <Input name="note" placeholder="Not (opsiyonel, şimdilik kaydedilmez)" />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
            >
              Abone yap
            </button>
          </form>
        )}
      </div>

      {/* Üyelikler */}
      <div className="rounded-2xl border">
        <div className="border-b px-4 py-3 font-semibold">Üyelikler</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Kulüp</th>
              <th className="px-4 py-3">Etkinlik</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Katılım</th>
              <th className="px-4 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{m.club.name}</div>
                  <div className="text-xs text-gray-500">/{m.club.slug}</div>
                </td>
                <td className="px-4 py-3">
                  {m.event ? (
                    <div className="text-sm text-gray-800">
                      <div>{m.event.title}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(m.event.startsAt).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">{m.role}</td>
                <td className="px-4 py-3">
                  {m.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 px-2 py-1">
                      ● Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2 py-1">
                      ⏳ Pasif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{new Date(m.joinedAt).toLocaleDateString('tr-TR')}</td>
                <td className="px-4 py-3">
                  <form action={deactivateMembership}>
                    <input type="hidden" name="membershipId" value={m.id} />
                    <input type="hidden" name="userId" value={user.id} />
                    <button className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50">Etkinlikten çıkar</button>
                  </form>
                  <form action={removeFromClub} className="mt-1">
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="clubId" value={m.club.id} />
                    <button className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50">Kulüpten çıkar</button>
                  </form>
                </td>
              </tr>
            ))}
            {!memberships.length && (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={5}>
                  Üyelik bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Abonelikler */}
      <div className="rounded-2xl border">
        <div className="border-b px-4 py-3 font-semibold">Abonelikler</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Kulüp</th>
              <th className="px-4 py-3">Etkinlik</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Başlangıç</th>
              <th className="px-4 py-3">Bitiş</th>
              <th className="px-4 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{s.club.name}</div>
                  <div className="text-xs text-gray-500">/{s.club.slug}</div>
                </td>
                <td className="px-4 py-3">
                  {s.event ? (
                    <div>
                      <div>{s.event.title}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(s.event.startsAt).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {s.active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 px-2 py-1">
                      ● Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2 py-1">
                      ⏳ Pasif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {s.startedAt ? new Date(s.startedAt).toLocaleDateString('tr-TR') : '—'}
                </td>
                <td className="px-4 py-3">
                  {s.canceledAt ? new Date(s.canceledAt).toLocaleDateString('tr-TR') : '—'}
                </td>
                <td className="px-4 py-3">
                  {s.active && (
                    <form action={cancelSubscriptionAction}>
                      <input type="hidden" name="subscriptionId" value={s.id} />
                      <input type="hidden" name="userId" value={user.id} />
                      <button className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50">İptal et</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {!subscriptions.length && (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={5}>
                  Abonelik bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Takip ilişkileri */}
      <div className="grid gap-4 md:grid-cols-2">
        <Followers userId={id} />
        <Following userId={id} />
      </div>

      {/* Kullanıcının gönderileri */}
      <UserPosts userId={id} />

      {/* Kullanıcının sohbet mesajları */}
      <UserMessages userId={id} />
    </div>
  )
}

async function Followers({ userId }: { userId: string }) {
  const rows = await prisma.follow.findMany({
    where: { followingId: userId },
    select: { follower: { select: { id: true, name: true, email: true, username: true } } },
    take: 100,
  })
  return (
    <div className="rounded-2xl border">
      <div className="border-b px-4 py-3 font-semibold">Takipçiler</div>
      <ul className="p-3 text-sm space-y-1 max-h-72 overflow-auto">
        {rows.map((r) => (
          <li key={r.follower.id}>{r.follower.name || '—'} {r.follower.username ? `(@${r.follower.username})` : ''} — {r.follower.email}</li>
        ))}
        {!rows.length && <li className="text-gray-500">Takipçi yok.</li>}
      </ul>
    </div>
  )
}

async function Following({ userId }: { userId: string }) {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { following: { select: { id: true, name: true, email: true, username: true } } },
    take: 100,
  })
  return (
    <div className="rounded-2xl border">
      <div className="border-b px-4 py-3 font-semibold">Takip ettikleri</div>
      <ul className="p-3 text-sm space-y-1 max-h-72 overflow-auto">
        {rows.map((r) => (
          <li key={r.following.id}>{r.following.name || '—'} {r.following.username ? `(@${r.following.username})` : ''} — {r.following.email}</li>
        ))}
        {!rows.length && <li className="text-gray-500">Takip ettiği yok.</li>}
      </ul>
    </div>
  )
}

async function UserPosts({ userId }: { userId: string }) {
  const posts = await prisma.post.findMany({ where: { ownerId: userId }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, createdAt: true, body: true } })
  return (
    <div className="rounded-2xl border">
      <div className="border-b px-4 py-3 font-semibold">Son Gönderiler</div>
      <ul className="p-3 text-sm space-y-2">
        {posts.map((p) => (
          <li key={p.id} className="border rounded-lg p-2">
            <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString('tr-TR')}</div>
            <div className="whitespace-pre-wrap">{p.body.slice(0, 240)}</div>
          </li>
        ))}
        {!posts.length && <li className="text-gray-500">Gönderi yok.</li>}
      </ul>
    </div>
  )
}

async function UserMessages({ userId }: { userId: string }) {
  const msgs = await prisma.chatMessage.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      body: true,
      isSecret: true,
      createdAt: true,
      room: {
        select: {
          event: {
            select: {
              id: true,
              title: true,
              startsAt: true,
              club: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  })
  return (
    <div className="rounded-2xl border">
      <div className="border-b px-4 py-3 font-semibold">Son Sohbet Mesajları</div>
      <ul className="p-3 text-sm space-y-2 max-h-[420px] overflow-auto">
        {msgs.map((m) => {
          const ev = m.room?.event
          const club = ev?.club
          return (
            <li key={m.id} className="border rounded-lg p-2">
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span>{new Date(m.createdAt).toLocaleString('tr-TR')}</span>
                {club && (<span>• {club.name}{ev?.title ? ` — ${ev.title}` : ''}</span>)}
                {m.isSecret && <span className="rounded-full bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5">Gizli</span>}
              </div>
              <div className="whitespace-pre-wrap mt-1">{m.body}</div>
            </li>
          )
        })}
        {!msgs.length && <li className="text-gray-500">Mesaj yok.</li>}
      </ul>
    </div>
  )
}
