// src/app/admin/members/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Prisma } from '@prisma/client' // QueryMode için değer olarak import

export const dynamic = 'force-dynamic'

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  const q = (searchParams?.q || '').trim()

  const where: Prisma.UserWhereInput =
    q.length > 0
      ? {
          OR: [
            { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
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
      lastSeenAt: true,
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
    take: 200,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Üyeler</h1>
        <form action="/admin/members" className="min-w-[280px]">
          <Input name="q" defaultValue={q} placeholder="İsim, e-posta, kullanıcı adı" />
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Üye</th>
              <th className="px-4 py-3">İstatistik</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t align-top">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.name || '—'}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                  {u.username && (
                    <div className="text-xs text-gray-500">@{u.username}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-gray-700">
                    Kulüp üyeliği:{' '}
                    <span className="font-medium">{(u._count as any).Memberships}</span>
                  </div>
                  <div className="text-xs text-gray-700">
                    Abonelik:{' '}
                    <span className="font-medium">{(u._count as any).Subscriptions}</span>
                  </div>
                  <div className="text-xs text-gray-700">
                    Post: <span className="font-medium">{(u._count as any).posts}</span>, Yorum:{' '}
                    <span className="font-medium">{(u._count as any).comments}</span>, Beğeni:{' '}
                    <span className="font-medium">{(u._count as any).likes}</span>
                  </div>
                  <div className="text-xs text-gray-700">
                    Sohbet Mesajı:{' '}
                    <span className="font-medium">{(u._count as any).ChatMessage}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  <div>Katıldı: {new Date(u.createdAt).toLocaleDateString('tr-TR')}</div>
                  {u.lastSeenAt && (
                    <div>Son görüldü: {new Date(u.lastSeenAt).toLocaleString('tr-TR')}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/members/${u.id}`}
                      className="rounded-full bg-gray-900 text-white px-3 py-1.5 hover:bg-black"
                    >
                      Detay
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={4}>
                  Üye bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}






