// src/app/admin/payments/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Params = {
  searchParams?: {
    q?: string
    status?: 'ALL' | 'SUCCEEDED' | 'FAILED' | 'REQUIRES_PAYMENT'
    scope?: 'all' | 'failed_then_succeeded' | 'failed_stuck'
    per?: 'all' | 'day' | 'week' | 'month' | 'prev_month'
  }
}

function toTL(kurus: number | null | undefined) {
  const v = (kurus || 0) / 100
  return v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function PaymentsPage({ searchParams }: Params) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  const q = (searchParams?.q || '').trim()
  const status = (searchParams?.status as any) || 'ALL'
  const scope = (searchParams?.scope as any) || 'all'
  const per = (searchParams?.per as any) || 'all'

  // period
  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(dayStart.getTime() - (dayStart.getDay() === 0 ? 6 : dayStart.getDay() - 1) * 86400000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1)

  const wherePeriod =
    per === 'day' ? { createdAt: { gte: dayStart } } :
    per === 'week' ? { createdAt: { gte: weekStart } } :
    per === 'month' ? { createdAt: { gte: monthStart } } :
    per === 'prev_month' ? { createdAt: { gte: prevMonthStart, lt: prevMonthEnd } } :
    {}

  // base filter
  const whereBase: any = {
    ...(status === 'ALL' ? {} : { status }),
    ...(q ? {
      OR: [
        { merchantOid: { contains: q, mode: 'insensitive' } },
        { user: { OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
        ]}},
        { club: { name: { contains: q, mode: 'insensitive' } } },
        { event: { title: { contains: q, mode: 'insensitive' } } },
      ],
    } : {}),
    ...wherePeriod,
  }

  // Pull a slice (latest 500)
  const rows = await prisma.paymentIntent.findMany({
    where: whereBase,
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: {
      id: true,
      userId: true,
      clubId: true,
      clubEventId: true,
      amountTRY: true,
      status: true,
      createdAt: true,
      merchantOid: true,
      user: { select: { name: true, email: true, username: true } },
      club: { select: { name: true, slug: true } },
      event: { select: { title: true, startsAt: true } },
    },
  })

  // Build helper maps
  const successByKey = new Map<string, Date>()
  for (const r of rows) {
    if (r.status === 'SUCCEEDED') {
      const key = `${r.userId}:${r.clubEventId}`
      const at = new Date(r.createdAt)
      const prev = successByKey.get(key)
      if (!prev || at > prev) successByKey.set(key, at)
    }
  }

  const enhanced = rows.map((r) => {
    const key = `${r.userId}:${r.clubEventId}`
    const succAt = successByKey.get(key)
    const rescued = (r.status === 'FAILED' || r.status === 'REQUIRES_PAYMENT') && !!succAt && new Date(r.createdAt) <= succAt
    return { ...r, rescued }
  })

  const filtered = scope === 'failed_then_succeeded'
    ? enhanced.filter((r) => r.rescued)
    : scope === 'failed_stuck'
      ? enhanced.filter((r) => (r.status === 'FAILED' || r.status === 'REQUIRES_PAYMENT') && !r.rescued)
      : enhanced

  // Summary metrics
  const [sumAll, sumDay, sumWeek, sumMonth, sumPrevMonth] = await Promise.all([
    prisma.paymentIntent.aggregate({ _sum: { amountTRY: true }, where: { status: 'SUCCEEDED' } }),
    prisma.paymentIntent.aggregate({ _sum: { amountTRY: true }, where: { status: 'SUCCEEDED', createdAt: { gte: dayStart } } }),
    prisma.paymentIntent.aggregate({ _sum: { amountTRY: true }, where: { status: 'SUCCEEDED', createdAt: { gte: weekStart } } }),
    prisma.paymentIntent.aggregate({ _sum: { amountTRY: true }, where: { status: 'SUCCEEDED', createdAt: { gte: monthStart } } }),
    prisma.paymentIntent.aggregate({ _sum: { amountTRY: true }, where: { status: 'SUCCEEDED', createdAt: { gte: prevMonthStart, lt: prevMonthEnd } } }),
  ])

  const topEvents = await prisma.paymentIntent.groupBy({
    by: ['clubEventId'],
    where: { status: 'SUCCEEDED' },
    _sum: { amountTRY: true },
    _count: { _all: true },
    orderBy: { _sum: { amountTRY: 'desc' } },
    take: 10,
  })
  const bottomEventsRaw = await prisma.paymentIntent.groupBy({
    by: ['clubEventId'],
    where: { status: 'SUCCEEDED' },
    _sum: { amountTRY: true },
    _count: { _all: true },
    orderBy: { _sum: { amountTRY: 'asc' } },
    take: 10,
  })
  const bottomEvents = bottomEventsRaw.filter((t) => (t._sum.amountTRY || 0) > 0)

  const eventsInfo = await prisma.clubEvent.findMany({
    where: { id: { in: Array.from(new Set([...topEvents.map((t) => t.clubEventId), ...bottomEvents.map((t) => t.clubEventId)])) } },
    select: { id: true, title: true, club: { select: { name: true, slug: true } } },
  })
  const infoMap = new Map(eventsInfo.map((e) => [e.id, e]))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold">Ödemeler</h1>

        <form action="/admin/payments" className="flex flex-wrap items-center gap-2">
          <input name="q" defaultValue={q} placeholder="Kullanıcı, kulüp, etkinlik, OID" className="h-10 w-64 rounded-xl border px-3" />
          <select name="status" defaultValue={status} className="h-10 rounded-xl border px-3 text-sm">
            <option value="ALL">Durum: Tümü</option>
            <option value="SUCCEEDED">Başarılı</option>
            <option value="FAILED">Başarısız</option>
            <option value="REQUIRES_PAYMENT">Payment required</option>
          </select>
          <select name="scope" defaultValue={scope} className="h-10 rounded-xl border px-3 text-sm">
            <option value="all">Tümü</option>
            <option value="failed_then_succeeded">Başarısız → sonra Başarılı</option>
            <option value="failed_stuck">Başarısız/PR ve sonra başarı yok</option>
          </select>
          <select name="per" defaultValue={per} className="h-10 rounded-xl border px-3 text-sm">
            <option value="all">Tüm zamanlar</option>
            <option value="day">Bugün</option>
            <option value="week">Bu hafta</option>
            <option value="month">Bu ay</option>
            <option value="prev_month">Önceki ay</option>
          </select>
          <button className="h-10 rounded-xl bg-primary px-4 text-white">Uygula</button>
        </form>
      </div>

      {/* Özetsel metrikler */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="Toplam kazanç" value={`₺${toTL(sumAll._sum.amountTRY || 0)}`} />
        <SummaryCard label="Bugün" value={`₺${toTL(sumDay._sum.amountTRY || 0)}`} />
        <SummaryCard label="Bu hafta" value={`₺${toTL(sumWeek._sum.amountTRY || 0)}`} />
        <SummaryCard label="Bu ay" value={`₺${toTL(sumMonth._sum.amountTRY || 0)}`} />
        <SummaryCard label="Önceki ay" value={`₺${toTL(sumPrevMonth._sum.amountTRY || 0)}`} />
      </section>

      {/* En çok kazandıran etkinlikler */}
      <section className="rounded-2xl border bg-white">
        <div className="border-b px-4 py-3 font-semibold">En çok kazandıran etkinlikler</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2">Etkinlik</th>
                <th className="px-4 py-2">Kulüp</th>
                <th className="px-4 py-2">Adet</th>
                <th className="px-4 py-2">Toplam (₺)</th>
              </tr>
            </thead>
            <tbody>
              {topEvents.map((t) => {
                const info = infoMap.get(t.clubEventId)
                return (
                  <tr key={t.clubEventId} className="border-t">
                    <td className="px-4 py-2">{info?.title || '—'}</td>
                    <td className="px-4 py-2">{info?.club?.name || '—'}</td>
                    <td className="px-4 py-2">{t._count._all}</td>
                    <td className="px-4 py-2">{toTL(t._sum.amountTRY || 0)}</td>
                  </tr>
                )
              })}
              {!topEvents.length && (
                <tr><td className="px-4 py-6 text-gray-500" colSpan={4}>Kayıt yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* En az kazandıran etkinlikler */}
      <section className="rounded-2xl border bg-white">
        <div className="border-b px-4 py-3 font-semibold">En az kazandıran etkinlikler</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2">Etkinlik</th>
                <th className="px-4 py-2">Kulüp</th>
                <th className="px-4 py-2">Adet</th>
                <th className="px-4 py-2">Toplam (₺)</th>
              </tr>
            </thead>
            <tbody>
              {bottomEvents.map((t) => {
                const info = infoMap.get(t.clubEventId)
                return (
                  <tr key={t.clubEventId} className="border-t">
                    <td className="px-4 py-2">{info?.title || '—'}</td>
                    <td className="px-4 py-2">{info?.club?.name || '—'}</td>
                    <td className="px-4 py-2">{t._count._all}</td>
                    <td className="px-4 py-2">{toTL(t._sum.amountTRY || 0)}</td>
                  </tr>
                )
              })}
              {!bottomEvents.length && (
                <tr><td className="px-4 py-6 text-gray-500" colSpan={4}>Kayıt yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Liste */}
      <section className="rounded-2xl border bg-white">
        <div className="border-b px-4 py-3 font-semibold">Kayıtlar</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2">Tarih</th>
                <th className="px-4 py-2">Kullanıcı</th>
                <th className="px-4 py-2">Kulüp / Etkinlik</th>
                <th className="px-4 py-2">Tutar (₺)</th>
                <th className="px-4 py-2">Durum</th>
                <th className="px-4 py-2">OID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-2">
                    <div className="font-medium">{r.user?.name || '—'}</div>
                    <div className="text-xs text-gray-500">{r.user?.email || ''}{r.user?.username ? ` (@${r.user.username})` : ''}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium">{r.event?.title || '—'}</div>
                    <div className="text-xs text-gray-500">{r.club?.name || '—'}</div>
                  </td>
                  <td className="px-4 py-2">{toTL(r.amountTRY)}</td>
                  <td className="px-4 py-2">
                    {r.status === 'SUCCEEDED' && <span className="rounded-full bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 text-xs">Başarılı</span>}
                    {r.status === 'FAILED' && <span className="rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-xs">Başarısız</span>}
                    {r.status === 'REQUIRES_PAYMENT' && <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-xs">Payment required</span>}
                    {r.rescued && <span className="ml-2 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px]">Sonradan başarı</span>}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs"><Link href={`/subscribe/checkout/${r.merchantOid}`} className="underline" target="_blank">{r.merchantOid}</Link></td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td className="px-4 py-6 text-gray-500" colSpan={6}>Kayıt bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/5 p-4">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}
