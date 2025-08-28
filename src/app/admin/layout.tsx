// src/app/admin/layout.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Giriş yoksa ya da rol ADMIN değilse ana sayfaya gönder
  if (!session?.user) redirect('/')
  if ((session.user as any).role !== 'ADMIN') redirect('/')

  return (
    <div className="container mx-auto px-4 py-8">
      {children}
    </div>
  )
}
