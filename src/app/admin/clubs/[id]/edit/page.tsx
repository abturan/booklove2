// src/app/admin/clubs/[id]/edit/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ClubEditorForm from '@/components/admin/ClubEditorForm'

export const dynamic = 'force-dynamic'

export default async function EditClubPage({ params }: { params: { id: string } }) {
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
      moderator: { select: { id: true, name: true, email: true } },
      picks: {
        orderBy: { monthKey: 'desc' },
        select: {
          id: true,
          monthKey: true,
          isCurrent: true,
          note: true,
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              translator: true,
              pages: true,
              coverUrl: true,
              isbn: true, // <- backText yerine isbn
            },
          },
        },
      },
    },
  })
  if (!club) redirect('/admin')

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
        }}
        initialPrograms={club.picks.map(p => ({
          id: p.id,
          monthKey: p.monthKey,
          isCurrent: p.isCurrent,
          note: p.note || '',
          book: {
            title: p.book?.title || '',
            author: p.book?.author || '',
            translator: p.book?.translator || '',
            pages: p.book?.pages || null,
            coverUrl: p.book?.coverUrl || '',
            isbn: p.book?.isbn || '',
          },
        }))}
      />
    </div>
  )
}
