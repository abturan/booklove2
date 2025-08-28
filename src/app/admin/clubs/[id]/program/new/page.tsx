import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProgramForm from '@/components/admin/ProgramForm'

export const dynamic = 'force-dynamic'

export default async function NewProgramPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/')
  }

  const club = await prisma.club.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  })
  if (!club) redirect('/admin')

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Yeni program — {club.name}</h1>
      <ProgramForm clubId={club.id} />
    </div>
  )
}
