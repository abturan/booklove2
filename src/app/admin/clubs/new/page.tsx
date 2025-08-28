import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClubCreateForm from '@/components/admin/ClubCreateForm'

export const dynamic = 'force-dynamic'

export default async function NewClubPage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Yeni kulüp oluştur</h1>
      <ClubCreateForm />
    </div>
  )
}
