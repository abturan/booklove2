// src/components/profile/fb/ProfilePage.tsx
import Header from './Header'
import Tabs from './Tabs'
import AboutCard from './AboutCard'
import NotFound from './NotFound'
import PostsList from './PostsList'

export default function ProfilePage({
  user,
  tab,
}: {
  user: any | null
  tab: 'gonderiler' | 'diger'
}) {
  if (!user) {
    return (
      <main className="container max-w-xl mx-auto py-6 px-4">
        <NotFound />
      </main>
    )
  }

  return (
    <main className="container max-w-xl mx-auto pb-10">
      <Header user={user} />
      <div className="px-4">
        <Tabs
          value={tab}
          onChange={(v) => location.replace(`?tab=${v}`)}
          tabs={[
            { value: 'gonderiler', label: 'Gönderiler' },
            { value: 'diger', label: 'Diğer' },
          ]}
        />
        {tab === 'gonderiler' && (
          <section className="mt-4 space-y-4">
            <PostsList ownerId={user.id} />
            <AboutCard user={user} />
          </section>
        )}
        {tab === 'diger' && (
          <section className="mt-4">
            <AboutCard user={user} />
          </section>
        )}
      </div>
    </main>
  )
}
