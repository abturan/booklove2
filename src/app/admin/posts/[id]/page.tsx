// src/app/admin/posts/[id]/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  const id = params.id
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      body: true,
      createdAt: true,
      status: true,
      owner: { select: { id: true, name: true, email: true, username: true } },
      images: { select: { url: true, width: true, height: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })
  if (!post) redirect('/admin/posts')

  const [likers, comments] = await Promise.all([
    prisma.like.findMany({ where: { postId: id }, select: { user: { select: { id: true, name: true, email: true, username: true } } } }),
    prisma.comment.findMany({ where: { postId: id }, orderBy: { createdAt: 'asc' }, select: { id: true, body: true, createdAt: true, user: { select: { id: true, name: true, email: true, username: true } } } }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Post Detay</h1>
      <div className="rounded-2xl border p-4 bg-white">
        <div className="text-sm text-gray-600">Kullanıcı</div>
        <div className="font-medium">{post.owner?.name || '—'} {post.owner?.username ? `(@${post.owner.username})` : ''}</div>
        <div className="text-xs text-gray-500">{post.owner?.email || ''}</div>
        <div className="mt-3 text-sm text-gray-600">İçerik</div>
        <div className="whitespace-pre-wrap">{post.body}</div>
        <div className="mt-3 text-sm text-gray-600">Durum / Tarih</div>
        <div className="text-sm">{post.status} — {new Date(post.createdAt).toLocaleString('tr-TR')}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white">
          <div className="border-b px-4 py-3 font-semibold">Beğenenler ({post._count.likes})</div>
          <ul className="p-3 text-sm space-y-2 max-h-80 overflow-auto">
            {likers.map((l, i) => (
              <li key={i} className="border rounded-lg p-2">
                <div className="font-medium">{l.user.name || '—'} {l.user.username ? `(@${l.user.username})` : ''}</div>
                <div className="text-xs text-gray-500">{l.user.email}</div>
              </li>
            ))}
            {!likers.length && <li className="text-gray-500">Beğeni yok.</li>}
          </ul>
        </div>
        <div className="rounded-2xl border bg-white">
          <div className="border-b px-4 py-3 font-semibold">Yorumlar ({post._count.comments})</div>
          <ul className="p-3 text-sm space-y-2 max-h-80 overflow-auto">
            {comments.map((c) => (
              <li key={c.id} className="border rounded-lg p-2">
                <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString('tr-TR')}</div>
                <div className="font-medium">{c.user.name || '—'} {c.user.username ? `(@${c.user.username})` : ''}</div>
                <div className="text-xs text-gray-500">{c.user.email}</div>
                <div className="mt-1 whitespace-pre-wrap">{c.body}</div>
              </li>
            ))}
            {!comments.length && <li className="text-gray-500">Yorum yok.</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
