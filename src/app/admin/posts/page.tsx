// src/app/admin/posts/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PostsPage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { id: true, createdAt: true, status: true, owner: { select: { name: true, email: true } } },
  })

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Post’lar</h2>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Kullanıcı</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(p => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.owner?.name || '—'}</div>
                  <div className="text-xs text-gray-500">{p.owner?.email || ''}</div>
                </td>
                <td className="px-4 py-3">{p.status}</td>
                <td className="px-4 py-3">{new Date(p.createdAt).toLocaleString('tr-TR')}</td>
              </tr>
            ))}
            {!posts.length && (
              <tr><td className="px-4 py-6 text-gray-500" colSpan={3}>Kayıt yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
