import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { monthKey } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ModClub() {
  const session = await auth()
  if ((session as any)?.role !== 'MODERATOR') return <div className="mt-10">Unauthorized</div>
  const me = await prisma.user.findUnique({ where: { email: session!.user!.email! } })
  if (!me) return <div>User?</div>
  const club = await prisma.club.findFirst({ where: { moderatorId: me.id }, include: { picks: { include: { book: true }, orderBy: { monthKey: 'desc' } }, events: true } })
  if (!club) return <div>Kulübün yok</div>

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-4">
        <div className="font-medium mb-2">Kulüp bilgileri</div>
        <form action="/api/mod/club" method="post" className="space-y-2">
          <input type="hidden" name="id" value={club.id} />
          <input name="name" defaultValue={club.name} className="w-full rounded-2xl border px-3 py-2" />
          <textarea name="description" defaultValue={club.description ?? ''} className="w-full rounded-2xl border px-3 py-2" />
          <input name="bannerUrl" defaultValue={club.bannerUrl ?? ''} className="w-full rounded-2xl border px-3 py-2" placeholder="Banner URL" />
          <button className="rounded-2xl bg-gray-900 text-white px-4 py-2">Kaydet</button>
        </form>
      </div>

      <div className="card p-4">
        <div className="font-medium mb-2">Bu ayın seçkisi</div>
        <form action="/api/mod/pick" method="post" className="space-y-2">
          <input type="hidden" name="clubId" value={club.id} />
          <input name="title" placeholder="Kitap adı" className="w-full rounded-2xl border px-3 py-2" />
          <input name="author" placeholder="Yazar" className="w-full rounded-2xl border px-3 py-2" />
          <input name="coverUrl" placeholder="Kapak URL" className="w-full rounded-2xl border px-3 py-2" />
          <button className="rounded-2xl bg-gray-900 text-white px-4 py-2">Bu ay olarak ayarla</button>
        </form>
        <div className="mt-4 text-sm text-gray-600">
          Şu an: {club.picks.find(p => p.isCurrent)?.book.title || '—'}
        </div>
      </div>

      <div className="card p-4 md:col-span-2">
        <div className="font-medium mb-2">Etkinlik planla</div>
        <form action="/api/mod/event" method="post" className="space-y-2">
          <input type="hidden" name="clubId" value={club.id} />
          <input name="startsAt" placeholder="2025-09-01T20:00:00" className="w-full rounded-2xl border px-3 py-2" />
          <button className="rounded-2xl bg-gray-900 text-white px-4 py-2">Oluştur</button>
        </form>
      </div>
    </div>
  )
}
