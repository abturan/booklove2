import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PublishButton from '../../../../components/admin/publish-button'
import EventParticipantsButton from '@/components/admin/EventParticipantsButton'

export const dynamic = 'force-dynamic'

export default async function AdminPreview({
  params,
}: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  const club = await prisma.club.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      bannerUrl: true,
      priceTRY: true,
      capacity: true,
      published: true,
      moderator: { select: { name: true } },
      events: {
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          title: true,
          startsAt: true,
          priceTRY: true,
          capacity: true,
          notes: true,
          bookTitle: true,
          bookAuthor: true,
          bookTranslator: true,
          bookPages: true,
          bookIsbn: true,
          bookCoverUrl: true,
          memberships: { where: { isActive: true }, select: { id: true } },
          subscriptions: { where: { active: true }, select: { id: true } },
        },
      },
    },
  })
  if (!club) redirect('/admin')

  return (
    <div className="space-y-4">
      <div className="sticky top-4 z-10 rounded-2xl border bg-white/80 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div className="text-sm">
          <span className="font-medium">{club.name}</span> — /{club.slug}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/clubs/${club.slug}`} className="rounded-full border px-3 py-1.5 hover:bg-gray-50" target="_blank">
            Kamu sayfasını aç
          </Link>
          <Link href={`/admin/clubs/${club.id}/edit`} className="rounded-full border px-3 py-1.5 hover:bg-gray-50">
            Düzenle
          </Link>
          <PublishButton id={club.id} initial={!!club.published} />
        </div>
      </div>

      <div className="relative h-56 rounded-3xl overflow-hidden">
        <Image
          src={
            club.bannerUrl ||
            'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1600&auto=format&fit=crop'
          }
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="flex items-center gap-6">
        <h1 className="text-2xl font-semibold">
          {club.moderator?.name ? `${club.moderator.name} — ` : ''}
          {club.name}
        </h1>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">₺{club.priceTRY}</span>
        <span className="text-sm text-gray-500">
          Toplam aktif katılımcı: {club.events.reduce((sum, ev) => sum + ev.memberships.length, 0)}
        </span>
      </div>

      <p className="text-gray-700">{club.description || 'Açıklama yok.'}</p>

      <div className="rounded-2xl border">
        <div className="border-b px-4 py-3 font-semibold">Etkinlikler</div>
        {club.events.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Henüz etkinlik yok. <Link href={`/admin/clubs/${club.id}/program/new`} className="underline">Yeni etkinlik ekle</Link></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Başlık</th>
                  <th className="px-4 py-3">Kitap</th>
                  <th className="px-4 py-3">Ücret</th>
                  <th className="px-4 py-3">Kapasite</th>
                  <th className="px-4 py-3">Aktif Üye</th>
                  <th className="px-4 py-3">Aktif Abonelik</th>
                  <th className="px-4 py-3">Not</th>
                  <th className="px-4 py-3 text-right">Katılımcılar</th>
                </tr>
              </thead>
              <tbody>
                {club.events.map((event) => (
                  <tr key={event.id} className="border-t align-top">
                    <td className="px-4 py-3">
                      {new Date(event.startsAt).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">{event.title || 'Aylık Oturum'}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {event.bookTitle ? (
                        <div>
                          <div className="font-medium text-gray-900">{event.bookTitle}</div>
                          <div className="text-gray-600">
                            {event.bookAuthor || '—'}
                            {event.bookTranslator ? ` · Çeviri: ${event.bookTranslator}` : ''}
                          </div>
                          <div className="text-gray-500">
                            {event.bookPages ? `${event.bookPages} sayfa` : ''}
                            {event.bookIsbn ? ` ${event.bookPages ? '• ' : ''}ISBN: ${event.bookIsbn}` : ''}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      ₺{((event.priceTRY ?? club.priceTRY) ?? 0).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      {typeof event.capacity === 'number'
                        ? event.capacity > 0
                          ? event.capacity
                          : 'Sınırsız'
                        : typeof club.capacity === 'number'
                          ? club.capacity > 0
                            ? `${club.capacity} (kulüp varsayılanı)`
                            : 'Sınırsız'
                          : '—'}
                    </td>
                    <td className="px-4 py-3">{event.memberships.length}</td>
                    <td className="px-4 py-3">{event.subscriptions.length}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-pre-wrap">
                      {event.notes || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <EventParticipantsButton
                        eventId={event.id}
                        eventTitle={event.title || 'Aylık Oturum'}
                        startsAt={event.startsAt.toISOString()}
                        clubSlug={club.slug}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
