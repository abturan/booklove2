import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import LeaveButton from '@/components/LeaveButton'
import ProfileForms from '@/components/profile/ProfileForms'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.email) return <div className="p-6">Lütfen giriş yapın.</div>

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      Memberships: {
        where: { isActive: true },
        include: { club: { select: { id: true, slug: true, name: true, bannerUrl: true } } }
      }
    }
  })
  if (!me) return <div className="p-6">Bulunamadı</div>

  return (
    <div className="space-y-6">
      <div className="relative h-40 rounded-3xl overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop"
          alt=""
          fill
          className="object-cover"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* sol */}
        <div className="space-y-3">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-white">
                <Image
                  src={
                    me.avatarUrl ||
                    `https://api.dicebear.com/8.x/thumbs/png?seed=${encodeURIComponent(me.id)}`
                  }
                  alt={me.name || 'Kullanıcı'}
                  fill
                />
              </div>
              <div>
                <div className="font-medium">{me.name}</div>
                <div className="text-sm text-gray-600">{me.email}</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <SignOutButton />
          </div>

          <div className="card p-4 space-y-2 text-sm text-gray-600">
            <div>Profil bilgilerini güncel tut; öneriler ve kulüp seçimleri buna göre iyileşir.</div>
          </div>
        </div>

        {/* sağ */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileForms
            me={{
              id: me.id,
              name: me.name,
              bio: me.bio,
              avatarUrl: me.avatarUrl,
              email: me.email
            }}
          />

          {/* Kulüplerim */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Kulüplerim</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {me.Memberships.map((m) => (
                <div key={m.club.id} className="card p-3">
                  <div className="relative h-24 rounded-xl overflow-hidden">
                    <Image
                      src={
                        m.club.bannerUrl ||
                        'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop'
                      }
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-3 font-medium">{m.club.name}</div>
                  <div className="mt-2 flex gap-2">
                    <Link
                      href={`/clubs/${m.club.slug}`}
                      className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm"
                    >
                      İncele
                    </Link>
                    <LeaveButton clubId={m.club.id} />
                  </div>
                </div>
              ))}
              {!me.Memberships.length && (
                <div className="text-sm text-gray-600">Kulüp yok.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
