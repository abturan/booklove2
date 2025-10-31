// src/app/admin/members/[id]/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { assignMemberToClub } from '../actions'
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{user.name || '—'}</h1>
          <div className="text-sm text-gray-600">{user.email}</div>
          {user.username && <div className="text-sm text-gray-600">@{user.username}</div>}
          <div className="mt-2 text-xs text-gray-500">
            Katıldı: {new Date(user.createdAt).toLocaleDateString('tr-TR')}
            {user.lastSeenAt && (
              <> · Son görüldü: {new Date(user.lastSeenAt).toLocaleString('tr-TR')}</>
            )}
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
    </div>
  )
}
