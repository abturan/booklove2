import HeroSlider from '@/components/HeroSlider'
import SearchFilters from '@/components/SearchFilters'
import InfiniteClubs from '@/components/InfiniteClubs'

export default async function Home({ searchParams }: { searchParams: any }) {
  const q: Record<string, string | undefined> = {}
  if (typeof searchParams?.q === 'string') q.q = searchParams.q
  if (typeof searchParams?.sort === 'string') q.sort = searchParams.sort

  return (
    <div className="space-y-6">
      <HeroSlider />
      <SearchFilters />
      <InfiniteClubs initialQuery={q} />
    </div>
  )
}
