import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PublicProfileSidebar from '@/components/sidebars/PublicProfileSidebar'
import InfiniteFeed from '@/components/feed/InfiniteFeed'
import ProfileBanner from '@/components/profile/ProfileBanner'
import ProfileAboutCard from '@/components/profile/ProfileAboutCard'
import ProfileTabs from '@/components/profile/ProfileTabs'
import { slugify } from '@/lib/slugify'

type Props = { params: { username: string } }
export const dynamic = 'force-dynamic'

function sanitizeHandle(s: string) {
  try { return decodeURIComponent((s || '').replace(/^@+/, '')).trim() } catch { return (s || '').replace(/^@+/, '').trim() }
}
function deslug(s: string) { return (s || '').replace(/-/g, ' ').trim() }
function normalizeTR(s: string) {
  return (s || '')
    .replace(/ç/gi, 'c').replace(/ğ/gi, 'g').replace(/[ıİ]/g, 'i')
    .replace(/ö/gi, 'o').replace(/ş/gi, 's').replace(/ü/gi, 'u').trim()
}
function variants(raw: string) {
  const base = deslug(raw); const a = normalizeTR(base); const b = base.replace(/ı/g, 'i').replace(/i/g, 'ı')
  return Array.from(new Set([base, a, b])).filter(Boolean)
}
function toTRDiacriticVersion(t: string) {
  return (t || '').replace(/c/g, 'ç').replace(/g/g, 'ğ').replace(/i/g, 'ı').replace(/o/g, 'ö').replace(/s/g, 'ş').replace(/u/g, 'ü')
}

export default async function PublicProfilePage({ params }: Props) {
  const session = await auth()
  const viewerId = session?.user?.id || null
  const handle = sanitizeHandle(params.username)

  let user =
    (await prisma.user.findFirst({
      where: { OR: [{ username: handle }, { slug: handle }] },
      select: {
        id: true, name: true, username: true, slug: true, bio: true, avatarUrl: true, bannerUrl: true,
        createdAt: true,
      },
    })) || null

  if (!user) {
    const tries = variants(handle)
    for (const v of tries) {
      const exact = await prisma.user.findFirst({
        where: { name: { equals: v, mode: 'insensitive' } },
        select: { id: true, name: true, username: true, slug: true, bio: true, avatarUrl: true, bannerUrl: true, createdAt: true },
      })
      if (exact) { user = exact; break }
      const partial = await prisma.user.findFirst({
        where: { name: { contains: v, mode: 'insensitive' } },
        select: { id: true, name: true, username: true, slug: true, bio: true, avatarUrl: true, bannerUrl: true, createdAt: true },
      })
      if (partial) { user = partial; break }
    }
  }

  if (!user) {
    const tokens = deslug(handle).split(/\s+/).filter(Boolean)
    const trTokens = tokens.map(toTRDiacriticVersion).filter((x, i) => x && x !== tokens[i])
    const orConds: any[] = []
    for (const t of tokens) orConds.push({ name: { contains: t, mode: 'insensitive' } })
    for (const t of trTokens) orConds.push({ name: { contains: t, mode: 'insensitive' } })

    const candidates = orConds.length
      ? await prisma.user.findMany({
          where: { OR: orConds },
          select: {
            id: true, name: true, username: true, slug: true, bio: true, avatarUrl: true, bannerUrl: true, createdAt: true,
          },
          take: 100,
        })
      : []

    const matches = candidates.filter((c) => slugify((c.name || '').trim()) === handle)
    if (matches.length > 0) {
      matches.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      user = matches[0]
    }
  }

  if (!user) {
    const firstToken = deslug(handle).split(/\s+/).filter(Boolean)[0] || ''
    const stem = firstToken.length > 3 ? firstToken.slice(0, firstToken.length - 1) : firstToken
    if (stem) {
      const wide = await prisma.user.findMany({
        where: { name: { contains: stem, mode: 'insensitive' } },
        select: { id: true, name: true, username: true, slug: true, bio: true, avatarUrl: true, bannerUrl: true, createdAt: true },
        take: 200,
      })
      const matches = wide.filter((c) => slugify((c.name || '').trim()) === handle)
      if (matches.length > 0) {
        matches.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        user = matches[0]
      }
    }
  }

  if (!user) {
    // boş durum
    return (
      <div className="space-y-6">
        <ProfileBanner src={null} canEdit={false} />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card p-5">Profil bulunamadı.</div>
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-5">Bu profil henüz boş.</div>
          </div>
        </div>
      </div>
    )
  }

  const canonical = user.username || user.slug || slugify((user.name || '').trim())
  if (canonical && handle !== canonical) {
    redirect(`/u/${canonical}`)
  }

  const canEdit = viewerId === user.id

  // Sağ taraftaki "Kulüpler" sekmesi için üyelikler
  const memberships = await prisma.membership.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      club: {
        select: {
          id: true, slug: true, name: true, bannerUrl: true,
          _count: { select: { memberships: true, picks: true, events: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <ProfileBanner src={user.bannerUrl} canEdit={!!canEdit} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* SOL SİDEBAR */}
        <div>
          <PublicProfileSidebar userId={user.id} />
        </div>

        {/* SAĞ ANA İÇERİK */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileTabs
            items={[
              { value: 'about', label: 'Hakkında' },
              { value: 'clubs', label: 'Kulüpler' },
              { value: 'posts', label: 'Gönderiler' },
            ]}
            defaultValue="about"
          >
            {/* ABOUT */}
            <div data-tab="about">
              <ProfileAboutCard bio={user.bio ?? ''} />
            </div>

            {/* CLUBS */}
            <div data-tab="clubs" className="space-y-4">
              {memberships.length === 0 ? (
                <div className="card p-5 text-gray-600">Bu kullanıcının üye olduğu kulüp görünmüyor.</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {memberships.map((m) => (
                    <div key={m.club.slug} className="card p-4">
                      <div className="font-semibold">{m.club.name}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[12px] text-gray-600">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                          👥 <b className="font-semibold">{m.club._count.memberships}</b> Üye
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                          📚 <b className="font-semibold">{m.club._count.picks}</b> Seçki
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                          🗓️ <b className="font-semibold">{m.club._count.events}</b> Oturum
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* POSTS / FEED */}
            <div data-tab="posts">
              <InfiniteFeed scope={`user:${user.username || user.slug || slugify((user.name || '').trim())}`} />
            </div>
          </ProfileTabs>
        </div>
      </div>
    </div>
  )
}
