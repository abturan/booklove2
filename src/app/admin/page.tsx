// src/app/admin/page.tsx
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PublishButton from '../../components/admin/publish-button'

export const dynamic = 'force-dynamic'

export default async function AdminHome() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  const clubs = await prisma.club.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, name: true, slug: true, published: true, priceTRY: true,
      moderator: { select: { name: true, email: true } },
      _count: { select: { memberships: { where: { isActive: true } as any } } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kulüpler</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/clubs/new" className="rounded-full bg-rose-600 text-white px-4 py-2 hover:bg-rose-700">Yeni kulüp oluştur</Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Kulüp</th>
              <th className="px-4 py-3">Moderatör</th>
              <th className="px-4 py-3">Üye</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">/{c.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{c.moderator?.name || '—'}</div>
                  <div className="text-xs text-gray-500">{c.moderator?.email || ''}</div>
                </td>
                <td className="px-4 py-3">{(c._count as any).memberships}</td>
                <td className="px-4 py-3">
                  {c.published ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 px-2 py-1">● Yayında</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2 py-1">⏳ Taslak</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/clubs/${c.id}`} className="rounded-full bg-gray-900 text-white px-3 py-1.5 hover:bg-black">Önizleme</Link>
                    <Link href={`/admin/clubs/${c.id}/edit`} className="rounded-full border px-3 py-1.5 hover:bg-gray-50">Düzenle</Link>
                    <PublishButton id={c.id} initial={!!c.published} />
                  </div>
                </td>
              </tr>
            ))}
            {!clubs.length && (
              <tr><td className="px-4 py-6 text-gray-500" colSpan={5}>Kulüp bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
