// src/app/admin/layout.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/')
  if ((session.user as any).role !== 'ADMIN') redirect('/')

  // aktif sekmeyi belirlemek için path
  const h = headers()
  const pathname = h.get('x-pathname') || ''

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin' && pathname.startsWith(href))

  return (
    <div className="container mx-auto px-4 py-8">
      {/* üst admin navigasyonu */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Link href="/admin" className="text-gray-900">
            Admin
          </Link>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/admin"
            className={[
              'rounded-full px-4 py-2 text-sm transition',
              isActive('/admin') ? 'bg-gray-900 text-white' : 'border hover:bg-gray-50',
            ].join(' ')}
          >
            Kulüpler
          </Link>
          <Link
            href="/admin/members"
            className={[
              'rounded-full px-4 py-2 text-sm transition',
              isActive('/admin/members') ? 'bg-gray-900 text-white' : 'border hover:bg-gray-50',
            ].join(' ')}
          >
            Üyeler
          </Link>
        </nav>
      </div>

      {children}
    </div>
  )
}
