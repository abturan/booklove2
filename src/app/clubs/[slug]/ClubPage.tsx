// src/app/clubs/[slug]/ClubPage.tsx
import ClubInteractive from '@/components/club/ClubInteractive'
import { getInitial } from './_lib/getInitial'

export default async function ClubPage({ slug }: { slug: string }) {
  const initial = await getInitial(slug)
  if (!initial) return <div className="py-10">Kulüp bulunamadı.</div>
  return (
    <div className="overflow-x-hidden">
      <ClubInteractive initial={initial} />
    </div>
  )
}
