// src/app/admin/ads/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureAdsSchema } from '@/lib/ensureAdsSchema'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { deleteCampaign } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdsPage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  await ensureAdsSchema()

  const campaigns = await (prisma as any).adCampaign.findMany({
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, type: true, frequency: true, active: true, scope: true, createdAt: true, updatedAt: true, _count: { select: { Ads: true } } },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Reklam Kampanyaları</h2>
        <Link href="/admin/ads/new" className="rounded-full bg-primary px-3 py-1.5 text-sm text-white">Yeni Kampanya</Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Kampanya</th>
              <th className="px-4 py-3">Tip</th>
              <th className="px-4 py-3">Sıklık</th>
              <th className="px-4 py-3">Reklam sayısı</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c: any) => (
              <tr key={c.id} className="border-t align-top">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">Oluşturuldu: {new Date(c.createdAt).toLocaleString('tr-TR')}</div>
                </td>
                <td className="px-4 py-3">{c.type === 'rotate' ? 'Döngüsel' : 'En üstte sabit'}</td>
                <td className="px-4 py-3">{c.type === 'rotate' ? `Her ${c.frequency}. gönderi` : '—'}</td>
                <td className="px-4 py-3">{c._count?.Ads ?? 0}</td>
                <td className="px-4 py-3">{c.active ? 'Aktif' : 'Pasif'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/ads/${c.id}`} className="rounded-full border px-2.5 py-1 text-xs hover:bg-gray-50">Detay</Link>
                    <form action={deleteCampaign}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="rounded-full border px-2.5 py-1 text-xs text-red-700 hover:bg-red-50">Sil</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!campaigns.length && (
              <tr><td className="px-4 py-6 text-gray-500" colSpan={6}>Henüz kampanya yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
