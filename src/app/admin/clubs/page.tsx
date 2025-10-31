// src/app/admin/clubs/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PublishButton from '@/components/admin/publish-button'
import DeleteClubButton from '@/components/admin/DeleteClubButton'

export const dynamic = 'force-dynamic'

export default async function ClubsPage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  const clubs = await prisma.club.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      published: true,
      updatedAt: true,
      priceTRY: true,
      events: {
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          startsAt: true,
          title: true,
          priceTRY: true,
          capacity: true,
          memberships: { where: { isActive: true }, select: { id: true } },
        },
      },
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
              <th className="px-4 py-3">Etkinlikler</th>
              <th className="px-4 py-3">Aktif Katılımcı</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Güncellendi</th>
              <th className="px-4 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((c) => {
              const totalParticipants = c.events.reduce((sum, ev) => sum + ev.memberships.length, 0)
              const upcoming = c.events.find((ev) => ev.startsAt >= new Date())
              const lastEvent = c.events[c.events.length - 1]
              const eventSummary = upcoming ?? lastEvent ?? null

              return (
                <tr key={c.id} className="border-t align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">/{c.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    {c.events.length === 0 ? (
                      <span className="text-xs text-gray-500">Henüz etkinlik yok</span>
                    ) : (
                      <div className="space-y-1 text-xs text-gray-700">
                        <div>
                          {c.events.length} etkinlik · Son:
                          {' '}
                          {eventSummary
                            ? new Date(eventSummary.startsAt).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: 'short',
                              })
                            : '—'}
                        </div>
                        {eventSummary && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                            ₺{((eventSummary.priceTRY ?? c.priceTRY) ?? 0).toLocaleString('tr-TR')}
                          </span>
                            {typeof eventSummary.capacity === 'number' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                                Kapasite: {eventSummary.capacity > 0 ? eventSummary.capacity : '—'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {totalParticipants}
                    {c.events.length > 1 && (
                      <span className="block text-[11px] text-gray-500 mt-1">
                        Son etkinlik: {eventSummary ? eventSummary.memberships.length : 0}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{c.published ? 'Yayında' : 'Taslak'}</td>
                  <td className="px-4 py-3">{new Date(c.updatedAt).toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/admin/clubs/${c.id}/edit`}
                        className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        Düzenle
                      </Link>
                      <PublishButton id={c.id} initial={c.published} />
                      <DeleteClubButton id={c.id} name={c.name} />
                    </div>
                  </td>
                </tr>
              )
            })}
            {!clubs.length && (
              <tr><td className="px-4 py-6 text-gray-500" colSpan={6}>Kulüp bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
