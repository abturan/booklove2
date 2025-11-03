// src/app/admin/posts/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PostRowActions from '@/components/admin/PostRowActions'

export const dynamic = 'force-dynamic'

export default async function PostsPage({ searchParams }: { searchParams?: { q?: string; from?: string; to?: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  const q = (searchParams?.q || '').trim()
  const from = searchParams?.from ? new Date(searchParams.from) : null
  const to = searchParams?.to ? new Date(searchParams.to) : null

  const where: any = {
    ...(q ? {
      OR: [
        { body: { contains: q, mode: 'insensitive' } },
        { owner: { OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
        ] } },
        { comments: { some: { body: { contains: q, mode: 'insensitive' } } } },
        { comments: { some: { author: { OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
        ] } } } },
      ],
    } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      createdAt: true,
      status: true,
      body: true,
      owner: { select: { name: true, email: true, username: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Post’lar</h2>
        <form action="/admin/posts" className="flex items-center gap-2">
          <input name="q" defaultValue={q} placeholder="İçerik, kullanıcı, yorum" className="h-10 w-72 rounded-xl border px-3" />
          <input type="date" name="from" defaultValue={from ? new Date(from).toISOString().slice(0,10) : ''} className="h-10 rounded-xl border px-3 text-sm" />
          <input type="date" name="to" defaultValue={to ? new Date(to).toISOString().slice(0,10) : ''} className="h-10 rounded-xl border px-3 text-sm" />
          <button className="h-10 rounded-xl bg-primary px-4 text-white">Ara</button>
        </form>
      </div>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Kullanıcı</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Özet</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map(p => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.owner?.name || '—'}</div>
                  <div className="text-xs text-gray-500">{p.owner?.email || ''}{p.owner?.username ? ` (@${p.owner.username})` : ''}</div>
                </td>
                <td className="px-4 py-3">{p.status}</td>
                <td className="px-4 py-3 max-w-[420px] truncate" title={p.body}>{p.body}</td>
                <td className="px-4 py-3">{new Date(p.createdAt).toLocaleString('tr-TR')}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Link href={`/admin/posts/${p.id}`} className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">Detay</Link>
                    <PostRowActions id={p.id} />
                  </div>
                </td>
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
