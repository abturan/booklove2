// src/app/admin/page.tsx
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import AdminCharts from '@/components/admin/AdminCharts'
import ActiveUsersModalButton from '@/components/admin/ActiveUsersModalButton'

export const dynamic = 'force-dynamic'

type Row = { label: string; value: number }

export default async function AdminHome() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  // ----- üst kart metrikleri
  const now = new Date()
  const thresholdMin = 5
  const since = new Date(now.getTime() - thresholdMin * 60 * 1000)
  // Test kullanıcılarını hariç saymak için basit bir desen: example.com, +test, test@, dev@
  const testWhere: Prisma.UserWhereInput = {
    OR: [
      { email: { contains: '+test', mode: 'insensitive' } },
      { email: { endsWith: '@example.com', mode: 'insensitive' } },
      { email: { endsWith: '@test.com', mode: 'insensitive' } },
      { email: { startsWith: 'test', mode: 'insensitive' } },
      { email: { startsWith: 'dev', mode: 'insensitive' } },
    ],
  }

  const [userCountAll, userCountReal, clubCount, activeClubCount, paidIntents, subsActiveAll, realPaidSubsRows, upcomingEventCount, onlineCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { NOT: testWhere } }),
    prisma.club.count(),
    prisma.club.count({ where: { published: true } }),
    prisma.paymentIntent.findMany({
      where: { status: { in: ['PAID', 'SUCCEEDED'] } },
      select: { amountTRY: true, createdAt: true },
    }),
    prisma.subscription.count({ where: { active: true } }),
    prisma.$queryRaw<{ c: bigint }[]>`SELECT COUNT(DISTINCT (s."userId" || ':' || s."clubEventId"))::bigint AS c
      FROM "Subscription" s
      JOIN "PaymentIntent" p ON p."userId" = s."userId" AND p."clubEventId" = s."clubEventId" AND p."status" = 'SUCCEEDED'
      JOIN "User" u ON u."id" = s."userId"
      WHERE s."active" = true
        AND NOT (
          u."email" ILIKE '%+test%'
          OR u."email" ILIKE '%@example.com'
          OR u."email" ILIKE '%@test.com'
          OR u."email" ILIKE 'test%'
          OR u."email" ILIKE 'dev%'
        )`,
    prisma.clubEvent.count({ where: { startsAt: { gte: now } } }),
    prisma.user.count({ where: { lastSeenAt: { gte: since } } }),
  ])

  // amountTRY kuruş (int); gösterirken TL'ye çevir
  const revenueTRY = paidIntents.reduce((sum, p) => sum + (p.amountTRY ?? 0), 0) / 100
  const fmt = (n: number) => n.toLocaleString('tr-TR')

  // ----- grafikleri besleyecek zaman serileri (son 30 gün)
  const from = new Date(now.getTime() - 29 * 24 * 3600 * 1000)

  // PostgreSQL kullanıyoruz; date_trunc ile gruplayalım (raw).
  const usersDailyRaw = await prisma.$queryRaw<
    { d: Date; c: bigint }[]
  >`SELECT date_trunc('day', "createdAt") as d, COUNT(*)::bigint c
     FROM "User"
     WHERE "createdAt" >= ${from}
     GROUP BY 1 ORDER BY 1`

  const paymentsDailyRaw = await prisma.$queryRaw<
    { d: Date; s: bigint }[]
  >`SELECT date_trunc('day', "createdAt") as d, COALESCE(SUM("amountTRY"),0)::bigint s
     FROM "PaymentIntent"
     WHERE "createdAt" >= ${from} AND "status" IN ('PAID','SUCCEEDED')
     GROUP BY 1 ORDER BY 1`

  // eksik günleri 0 ile doldur
  const days: string[] = []
  for (let i = 0; i < 30; i++) {
    const dt = new Date(from.getTime() + i * 24 * 3600 * 1000)
    days.push(dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }))
  }

  const mapSeries = (raw: { d: Date; v: number }[], key: 'v'): Row[] =>
    days.map((label, i) => {
      const day = new Date(from.getTime() + i * 24 * 3600 * 1000)
      const hit = raw.find(r => new Date(r.d).toDateString() === day.toDateString())
      return { label, value: hit ? (hit as any)[key] : 0 }
    })

  const usersDaily: Row[] = mapSeries(
    usersDailyRaw.map(r => ({ d: r.d, v: Number(r.c) })), 'v'
  )
  const revenueDaily: Row[] = mapSeries(
    paymentsDailyRaw.map(r => ({ d: r.d, v: Math.round(Number(r.s) / 100) })), 'v'
  )

  // Averages for new members
  const sum30 = usersDaily.reduce((a, b) => a + (b.value || 0), 0)
  const avg30 = sum30 / 30
  const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
  const daysAll = (() => {
    if (!firstUser?.createdAt) return 1
    const diff = Math.max(1, Math.ceil((now.getTime() - new Date(firstUser.createdAt).getTime()) / (24 * 3600 * 1000)))
    return diff
  })()
  const avgAll = userCountAll / daysAll

  return (
    <div className="space-y-6">
      {/* Üst kartlar */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Toplam Üye" value={`${fmt(userCountReal)} (${fmt(userCountAll)})`} href="/admin/members" />
        <Card title={`Aktif Kullanıcı (~${thresholdMin}dk)`} value={fmt(onlineCount)} />
        <Card title="Kulüp (aktif)" value={`${fmt(activeClubCount)} / ${fmt(clubCount)}`} href="/admin/clubs" />
        <Card title="Etkinlik Aboneliği (aktif)" value={`${fmt(Number(realPaidSubsRows?.[0]?.c || 0))} (${fmt(subsActiveAll)})`} href="/admin/members" />
        <Card title="Yaklaşan Etkinlik" value={fmt(upcomingEventCount)} href="/admin/clubs" />
        <Card title="Toplam Ciro (₺)" value={fmt(revenueTRY)} />
      </section>

      {/* Aktif kullanıcı listesi */}
      <div>
        <ActiveUsersModalButton />
      </div>

      {/* Büyük linkler */}
      <section className="grid gap-4 sm:grid-cols-3">
        <BigLink href="/admin/clubs" label="Kulüpler" emoji="📚" />
        <BigLink href="/admin/members" label="Üyeler" emoji="👥" />
        <BigLink href="/admin/posts" label="Post’lar" emoji="📝" />
      </section>

      {/* Yeni üye ortalamaları */}
      <section className="rounded-2xl bg-white ring-1 ring-black/5 p-4">
        <div className="text-sm text-gray-600 mb-2">Yeni üye ortalamaları</div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center rounded-full border px-3 py-1 bg-gray-50 text-gray-700">
            Tüm zamanlar günlük ort.: <span className="ml-1 font-semibold">{avgAll.toFixed(2)}</span>
          </span>
          <span className="inline-flex items-center rounded-full border px-3 py-1 bg-gray-50 text-gray-700">
            Son 30 gün günlük ort.: <span className="ml-1 font-semibold">{avg30.toFixed(2)}</span>
          </span>
        </div>
      </section>

      {/* Grafikler — geri geldi */}
      <AdminCharts
        usersDaily={usersDaily}
        revenueDaily={revenueDaily}
        clubsSplit={{ active: activeClubCount, total: clubCount }}
      />
    </div>
  )
}

function Card({ title, value, href }: { title: string; value: string; href?: string }) {
  const body = (
    <div className="rounded-2xl bg-white ring-1 ring-black/5 p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
  return href ? <Link href={href}>{body}</Link> : body
}

function BigLink({ href, label, emoji }: { href: string; label: string; emoji: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl bg-white ring-1 ring-black/5 p-5 text-lg font-semibold hover:bg-gray-50"
    >
      <span className="text-3xl">{emoji}</span>
      {label}
    </Link>
  )
}
