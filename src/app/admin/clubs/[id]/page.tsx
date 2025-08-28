import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PublishButton from '../../../../components/admin/publish-button'

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
      published: true,
      moderator: { select: { name: true } },
      _count: { select: { memberships: { where: { isActive: true } as any } } },
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
          Üye sayısı: {(club._count as any).memberships}
        </span>
      </div>

      <p className="text-gray-700">{club.description || 'Açıklama yok.'}</p>
    </div>
  )
}
