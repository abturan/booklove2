// src/app/admin/posts/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Tab = 'PUBLISHED' | 'PENDING' | 'HIDDEN' | 'REPORTED'

export default async function AdminPostsPage({ searchParams }: { searchParams?: { s?: Tab } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  const s = (searchParams?.s as Tab) || 'PUBLISHED'

  const [published, pending, hidden, reported, items] = await Promise.all([
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.post.count({ where: { status: 'PENDING' } }),
    prisma.post.count({ where: { status: 'HIDDEN' } }),
    prisma.post.count({ where: { reports: { some: {} }, NOT: { status: 'HIDDEN' } } }),
    prisma.post.findMany({
      where: s === 'REPORTED' ? { reports: { some: {} }, NOT: { status: 'HIDDEN' } } : { status: s },
      orderBy:
        s === 'REPORTED'
          ? [{ reports: { _count: 'desc' } }, { createdAt: 'desc' }]
          : [{ createdAt: 'desc' }],
      take: 100,
      select: {
        id: true,
        body: true,
        createdAt: true,
        status: true,
        owner: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
        _count: { select: { comments: true, likes: true, reports: true } },
      },
    }),
  ])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'PUBLISHED', label: `Yayında (${published})` },
    { key: 'PENDING',   label: `Bekleyen (${pending})` },
    { key: 'HIDDEN',    label: `Gizli (${hidden})` },
    { key: 'REPORTED',  label: `Şikayet (${reported})` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Postlar</h1>
        <Link href="/admin" className="rounded-full border px-3 py-1.5 hover:bg-gray-50">Kulüplere dön</Link>
      </div>

      <div className="flex gap-2">
        {tabs.map(t => (
          <Link key={t.key} href={`/admin/posts?s=${t.key}`} className={`rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50 ${s===t.key ? 'bg-gray-900 text-white hover:bg-black' : ''}`}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Kullanıcı</th>
              <th className="px-4 py-3">İçerik</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Sayaçlar</th>
              <th className="px-4 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id} className="border-t align-top">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.owner.name}</div>
                  <div className="text-xs text-gray-500">@{p.owner.username || '—'}</div>
                </td>
                <td className="px-4 py-3 max-w-[520px]">
                  <div className="line-clamp-4 whitespace-pre-wrap">{p.body}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(p.createdAt).toLocaleString()}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2 py-1">
                    {p.status}
                  </span>
                  {s !== 'REPORTED' && p._count.reports > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2 py-1">
                      Raporlu
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">❤️ {p._count.likes} · 💬 {p._count.comments}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <form action={`/api/posts/${p.id}/moderate`} method="POST" onSubmit={(e)=>{e.preventDefault(); fetch(`/api/posts/${p.id}/moderate`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({action:'publish'})}).then(()=>location.reload())}}>
                      <button className="rounded-full border px-3 py-1.5 hover:bg-gray-50">Yayınla</button>
                    </form>
                    <form onSubmit={(e)=>{e.preventDefault(); fetch(`/api/posts/${p.id}/moderate`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({action:'pending'})}).then(()=>location.reload())}}>
                      <button className="rounded-full border px-3 py-1.5 hover:bg-gray-50">Beklet</button>
                    </form>
                    <form onSubmit={(e)=>{e.preventDefault(); fetch(`/api/posts/${p.id}/moderate`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({action:'hide'})}).then(()=>location.reload())}}>
                      <button className="rounded-full border px-3 py-1.5 hover:bg-gray-50">Gizle</button>
                    </form>
                    <form onSubmit={(e)=>{e.preventDefault(); fetch(`/api/posts/${p.id}`,{method:'DELETE'}).then(()=>location.reload())}}>
                      <button className="rounded-full bg-rose-600 text-white px-3 py-1.5 hover:bg-rose-700">Sil</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td className="px-4 py-6 text-gray-500" colSpan={5}>Kayıt yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
