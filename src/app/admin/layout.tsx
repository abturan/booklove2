// src/app/admin/layout.tsx
import AdminNav from '@/components/admin/AdminNav'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Yönetim Paneli</h1>
        <AdminNav />
      </header>
      {children}
    </div>
  )
}
