import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function MembersAdmin() {
  const session = await auth()
  if ((session as any)?.role !== 'ADMIN') return <div className="mt-10">Unauthorized</div>

  const rows = await prisma.membership.findMany({
    include: { user: true, club: true },
    orderBy: { joinedAt: 'desc' }
  })

  return (
    <div className="card p-4">
      <div className="font-medium mb-3">Tüm Üyelikler</div>
      <table className="w-full text-sm">
        <thead><tr><th className="text-left">Kullanıcı</th><th>Kulüp</th><th>Durum</th><th>Katılım</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-t">
              <td className="py-1">{r.user.name}</td>
              <td className="text-center">{r.club.name}</td>
              <td className="text-center">{r.isActive ? 'Aktif' : 'Pasif'}</td>
              <td className="text-center">{new Date(r.joinedAt).toLocaleDateString('tr-TR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
