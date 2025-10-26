// src/app/admin/members/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MembersPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  const q = (searchParams.q ?? '').trim()
  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { username: { contains: q, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {}

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      createdAt: true,
      _count: {
        select: {
          Memberships: { where: { isActive: true } as any },
          Subscriptions: { where: { active: true } as any },
          posts: true,
          comments: true,
          likes: true,
          dmMessagesAuthored: true,
        },
      },
    },
    take: 200,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Üyeler</h2>
        <form action="/admin/members" className="inline-flex items-center gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="İsim, e-posta, kullanıcı adı"
            className="h-10 w-72 rounded-xl border px-3"
          />
          <button className="h-10 rounded-xl bg-primary px-4 text-white">Ara</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Üye</th>
              <th className="px-4 py-3">İstatistik</th>
              <th className="px-4 py-3">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.name || '—'}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                  {u.username && <div className="text-xs text-gray-500">@{u.username}</div>}
                </td>
                <td className="px-4 py-3">
                  <div>Kulüp üyeliği: {u._count.Memberships}</div>
                  <div>Abonelik: {u._count.Subscriptions}</div>
                  <div>Post: {u._count.posts}, Yorum: {u._count.comments}, Beğeni: {u._count.likes}</div>
                  <div>Sohbet Mesajı: {u._count.dmMessagesAuthored}</div>
                </td>
                <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
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
