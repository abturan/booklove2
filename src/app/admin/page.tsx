// src/app/admin/page.tsx
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
  const [userCount, clubCount, activeClubCount, paidIntents, subsCount, upcomingEventCount, onlineCount] = await Promise.all([
    prisma.user.count(),
    prisma.club.count(),
    prisma.club.count({ where: { published: true } }),
    prisma.paymentIntent.findMany({
      where: { status: { in: ['PAID', 'SUCCEEDED'] } },
      select: { amountTRY: true, createdAt: true },
    }),
    prisma.subscription.count({ where: { active: true } }),
    prisma.clubEvent.count({ where: { startsAt: { gte: now } } }),
    prisma.user.count({ where: { lastSeenAt: { gte: since } } }),
  ])

  const revenueTRY = paidIntents.reduce((sum, p) => sum + (p.amountTRY ?? 0), 0) // ❗ bölme yok
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
    paymentsDailyRaw.map(r => ({ d: r.d, v: Number(r.s) })), 'v'
  )

  return (
    <div className="space-y-6">
      {/* Üst kartlar */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Toplam Üye" value={fmt(userCount)} href="/admin/members" />
        <Card title={`Aktif Kullanıcı (~${thresholdMin}dk)`} value={fmt(onlineCount)} />
        <Card title="Kulüp (aktif)" value={`${fmt(activeClubCount)} / ${fmt(clubCount)}`} href="/admin/clubs" />
        <Card title="Etkinlik Aboneliği (aktif)" value={fmt(subsCount)} href="/admin/members" />
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
