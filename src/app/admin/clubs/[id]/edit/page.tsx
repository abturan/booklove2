// src/app/admin/clubs/[id]/edit/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ClubEditorForm from '@/components/admin/ClubEditorForm'
import ClubEventsManager from '@/components/admin/ClubEventsManager'
import { ensureConferenceFlagColumn } from '@/lib/conferenceFlag'

export const dynamic = 'force-dynamic'

export default async function EditClubPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')
  await ensureConferenceFlagColumn()

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
      conferenceEnabled: true,
      moderator: { select: { id: true, name: true, email: true } },
    },
  })
  if (!club) redirect('/admin')

  const eventRecords = await prisma.clubEvent.findMany({
    where: { clubId: params.id },
    orderBy: { startsAt: 'asc' },
    select: {
      id: true,
      startsAt: true,
      title: true,
      notes: true,
      priceTRY: true,
      capacity: true,
      bookTitle: true,
      bookAuthor: true,
      bookTranslator: true,
      bookPages: true,
      bookIsbn: true,
      bookCoverUrl: true,
      memberships: { where: { isActive: true }, select: { id: true } },
      subscriptions: { where: { active: true }, select: { id: true } },
    },
  })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kulüp düzenle</h1>
        <Link
          href={`/admin/clubs/${club.id}`}
          className="rounded-full border px-3 py-1.5 hover:bg-gray-50"
        >
          Önizleme
        </Link>
      </div>
      <ClubEditorForm
        initialClub={{
          id: club.id,
          name: club.name,
          slug: club.slug,
          description: club.description || '',
          bannerUrl: club.bannerUrl || '',
          priceTRY: club.priceTRY || 0,
          moderator: club.moderator
            ? { id: club.moderator.id, name: club.moderator.name || '—', email: club.moderator.email }
            : null,
          capacity: club.capacity ?? null,
          conferenceEnabled: club.conferenceEnabled ?? false,
        }}
      />

      <div className="rounded-2xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Etkinlikleri yönet</h2>
          <Link
            href={`/admin/clubs/${club.id}/program/new`}
            className="rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Yeni etkinlik ekle
          </Link>
        </div>
        <p className="text-xs text-gray-500">
          Buradan tarih, ücret ve kapasite bilgilerini güncelleyebilirsiniz. Kulüp varsayılan fiyatı: ₺{(club.priceTRY ?? 0).toLocaleString('tr-TR')}.
        </p>
        <ClubEventsManager
          defaultPrice={club.priceTRY ?? null}
          defaultCapacity={club.capacity ?? null}
          items={eventRecords.map((event) => ({
            id: event.id,
            title: event.title,
            startsAt: event.startsAt.toISOString(),
            priceTRY: event.priceTRY,
            capacity: event.capacity,
            notes: event.notes,
            activeMembers: event.memberships.length,
            activeSubscriptions: event.subscriptions.length,
            bookTitle: event.bookTitle ?? '',
            bookAuthor: event.bookAuthor ?? '',
            bookTranslator: event.bookTranslator ?? '',
            bookPages: event.bookPages != null ? String(event.bookPages) : '',
            bookIsbn: event.bookIsbn ?? '',
            bookCoverUrl: event.bookCoverUrl ?? '',
          }))}
          clubSlug={club.slug}
        />
      </div>
    </div>
  )
}
