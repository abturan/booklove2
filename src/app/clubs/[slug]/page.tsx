import ClubPage from './ClubPage'

export default function Page({ params }: { params: { slug: string } }) {
  return <ClubPage slug={params.slug} />
}
