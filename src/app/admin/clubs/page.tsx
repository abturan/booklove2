// src/app/admin/clubs/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ClubsPage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  const clubs = await prisma.club.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, name: true, slug: true, published: true, updatedAt: true,
      _count: { select: { memberships: { where: { isActive: true } as any } } },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Kulüpler</h2>
        <Link href="/admin/clubs/new" className="rounded-xl bg-primary px-4 py-2 text-white">Yeni Kulüp</Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Kulüp</th>
              <th className="px-4 py-3">Üye</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Güncellendi</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map(c => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">/{c.slug}</div>
                </td>
                <td className="px-4 py-3">{(c._count as any).memberships}</td>
                <td className="px-4 py-3">{c.published ? 'Yayında' : 'Taslak'}</td>
                <td className="px-4 py-3">{new Date(c.updatedAt).toLocaleString('tr-TR')}</td>
              </tr>
            ))}
            {!clubs.length && (
              <tr><td className="px-4 py-6 text-gray-500" colSpan={4}>Kulüp bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
