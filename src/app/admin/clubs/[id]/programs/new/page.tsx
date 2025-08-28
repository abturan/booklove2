import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'
export default function LegacyProgramsNew({ params }: { params: { id: string } }) {
  redirect(`/admin/clubs/${params.id}/program/new`)
}
