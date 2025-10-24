// src/app/admin/layout.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/')
  if ((session.user as any).role !== 'ADMIN') redirect('/')

  const h = headers()
  const raw = (h.get('x-pathname') || h.get('next-url') || '') as string
  const pathname = raw.split('?')[0] || ''
  const isActive = (href: string) => pathname === href || (href !== '/admin' && pathname.startsWith(href))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Link href="/admin" className="text-gray-900">Admin</Link>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/admin" className={['rounded-full px-4 py-2 text-sm transition', isActive('/admin') ? 'bg-gray-900 text-white' : 'border hover:bg-gray-50'].join(' ')} aria-current={isActive('/admin') ? 'page' : undefined}>Kulüpler</Link>
          <Link href="/admin/members" className={['rounded-full px-4 py-2 text-sm transition', isActive('/admin/members') ? 'bg-gray-900 text-white' : 'border hover:bg-gray-50'].join(' ')} aria-current={isActive('/admin/members') ? 'page' : undefined}>Üyeler</Link>
          <Link href="/admin/posts" className={['rounded-full px-4 py-2 text-sm transition', isActive('/admin/posts') ? 'bg-gray-900 text-white' : 'border hover:bg-gray-50'].join(' ')} aria-current={isActive('/admin/posts') ? 'page' : undefined}>Postlar</Link>
        </nav>
      </div>
      {children}
    </div>
  )
}
