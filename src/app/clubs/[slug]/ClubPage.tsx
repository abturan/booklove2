// src/app/clubs/[slug]/ClubPage.tsx
import Banner from './Banner'
import ClubInteractive from '@/components/club/ClubInteractive'
import { getInitial } from './_lib/getInitial'

export default async function ClubPage({ slug }: { slug: string }) {
  const initial = await getInitial(slug)
  if (!initial) return <div className="py-10">Kulüp bulunamadı.</div>
  return (
    <div className="space-y-6 overflow-x-hidden">
      <Banner url={initial.club.bannerUrl} />
      <ClubInteractive initial={initial} />
    </div>
  )
}
