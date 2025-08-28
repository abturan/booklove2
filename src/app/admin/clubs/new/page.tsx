import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClubEditorForm from '@/components/admin/ClubEditorForm'

export const dynamic = 'force-dynamic'

export default async function NewClubPage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Yeni kulüp oluştur</h1>
      <ClubEditorForm
        mode="create"
        initial={{
          name: '',
          description: '',
          priceTRY: 0,
          bannerUrl: '',
        }}
      />
    </div>
  )
}
