// src/app/admin/members/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type SortKey = 'recent' | 'posts_desc' | 'followers_desc' | 'following_desc' | 'events_desc'

export default async function MembersPage({ searchParams }: { searchParams: { q?: string; sort?: SortKey } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  const q = (searchParams.q ?? '').trim()
  const sort = (searchParams.sort as SortKey) || 'recent'
  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { username: { contains: q, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {}

  const orderBy: any =
    sort === 'posts_desc' ? { posts: { _count: 'desc' } }
    : sort === 'followers_desc' ? { followers: { _count: 'desc' } }
    : sort === 'following_desc' ? { following: { _count: 'desc' } }
    : sort === 'events_desc' ? { Memberships: { _count: 'desc' } }
    : { createdAt: 'desc' }

  const users = await prisma.user.findMany({
    where,
    orderBy,
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      createdAt: true,
      Memberships: { where: { isActive: true }, select: { clubId: true } },
      Subscriptions: { where: { active: true }, select: { clubEventId: true } },
      _count: {
        select: {
          posts: true,
          comments: true,
          likes: true,
          dmMessagesAuthored: true,
          followers: true,
          following: true,
        },
      },
    },
    take: 200,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Üyeler</h2>
        <form action="/admin/members" className="flex flex-col gap-2 sm:inline-flex sm:flex-row sm:items-center">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="İsim, e-posta, kullanıcı adı"
            className="h-10 w-full sm:w-72 rounded-xl border px-3"
          />
          <select name="sort" defaultValue={sort} className="h-10 rounded-xl border px-3 text-sm">
            <option value="recent">En yeni</option>
            <option value="posts_desc">En fazla post</option>
            <option value="followers_desc">En fazla takipçi</option>
            <option value="following_desc">En fazla takip eden</option>
            <option value="events_desc">En fazla etkinliğe katılan</option>
          </select>
          <button className="h-10 rounded-xl bg-primary px-4 text-white">Ara</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Üye</th>
              <th className="px-4 py-3">İstatistik</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t align-top">
                <td className="px-4 py-3 whitespace-normal break-words">
                  <Link href={`/admin/members/${u.id}`} className="hover:underline font-medium">
                    {u.name || '—'}
                  </Link>
                  <div className="text-xs text-gray-500">{u.email}</div>
                  {u.username && <div className="text-xs text-gray-500">@{u.username}</div>}
                </td>
                <td className="px-4 py-3 whitespace-normal break-words">
                  <div>Aktif etkinlik üyeliği: {u.Memberships.length}</div>
                  <div>Post: {u._count.posts}, Yorum: {u._count.comments}, Beğeni: {u._count.likes}</div>
                  <div>Sohbet Mesajı: {u._count.dmMessagesAuthored}</div>
                </td>
                <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/members/${u.id}`} className="rounded-full border px-2.5 py-1 text-xs hover:bg-gray-50 whitespace-nowrap">Detay</Link>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={3}>
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
