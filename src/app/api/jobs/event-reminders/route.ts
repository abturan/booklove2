// src/app/api/jobs/event-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/mail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.EVENT_REMINDER_SECRET || process.env.AUTH_SALT || ''
  if (!secret) return false
  const hdr = req.headers.get('x-job-secret') || ''
  const q = req.nextUrl.searchParams.get('secret') || ''
  return hdr === secret || q === secret
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const hourMs = 60 * 60 * 1000
    const tol = 5 * 60 * 1000 // 5 min window

    const windows: Array<{ kind: '24h' | '1h'; from: Date; to: Date }> = [
      { kind: '24h', from: new Date(now + dayMs - tol), to: new Date(now + dayMs + tol) },
      { kind: '1h', from: new Date(now + hourMs - tol), to: new Date(now + hourMs + tol) },
    ]

    let total = 0
    for (const w of windows) {
      const events = await prisma.clubEvent.findMany({
        where: {
          startsAt: { gte: w.from, lte: w.to },
          reminders: { none: { kind: w.kind } },
        },
        select: {
          id: true,
          title: true,
          startsAt: true,
          club: { select: { name: true } },
          memberships: { where: { isActive: true }, select: { user: { select: { email: true, name: true } } } },
        },
      })

      for (const ev of events) {
        const subject = w.kind === '24h'
          ? `${ev.club.name} · "${ev.title}" yarın başlıyor`
          : `${ev.club.name} · "${ev.title}" 1 saat içinde başlıyor`
        const base = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || '').replace(/\/$/, '')
        const url = `${base}`
        const html = (name?: string | null) => `Merhaba ${name || ''},<br/><br/> ${ev.club.name} kulübünün "${ev.title}" oturumu ${w.kind === '24h' ? 'yarın' : 'yakında'} başlıyor.<br/><br/><a href="${url}" target="_blank">Etkinlik sayfasına git</a>`

        for (const m of ev.memberships) {
          const email = m.user?.email
          if (!email) continue
          try { await sendMail(email, subject, html(m.user?.name)) } catch {}
          total++
        }
        await prisma.eventReminder.create({ data: { clubEventId: ev.id, kind: w.kind } }).catch(() => {})
      }
    }
    return NextResponse.json({ status: 'ok', sent: total })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

