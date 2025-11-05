// src/app/api/admin/events/mail/[mailId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildEventMail } from '@/lib/eventMailTemplate'
import { sendMail } from '@/lib/mail'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Body = {
  recipientIds?: string[]
  extraEmails?: string[]
}

export async function POST(req: NextRequest, { params }: { params: { mailId: string } }) {
  try {
    const session = await auth()
    const user = session?.user
    if (!user || (user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as Body
    const selectedIds = Array.isArray(body?.recipientIds) ? body.recipientIds.filter(Boolean) : null
    const extraEmails = Array.isArray(body?.extraEmails)
      ? body.extraEmails
          .map((email) => (typeof email === 'string' ? email.trim() : ''))
          .filter((email) => email.length > 0)
      : []

    const originalMail = await prisma.eventMail.findUnique({
      where: { id: params.mailId },
      select: {
        id: true,
        eventId: true,
        note: true,
        subject: true,
        bodyHtml: true,
        previewText: true,
        event: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            club: { select: { id: true, name: true, slug: true, moderator: { select: { id: true, name: true, email: true } } } },
            memberships: {
              where: { isActive: true },
              select: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
            subscriptions: {
              where: { active: true },
              select: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        recipients: {
          select: { id: true, userId: true, email: true, name: true, status: true, sentAt: true, error: true, createdAt: true },
        },
      },
    })

    if (!originalMail?.event) {
      return NextResponse.json({ error: 'Mail bulunamadı' }, { status: 404 })
    }

    const event = originalMail.event
    const participantMap = new Map<string, { userId: string; name: string | null; email: string | null }>()
    const pushUser = (u: any) => {
      if (!u?.id) return
      participantMap.set(u.id, { userId: u.id, name: u.name, email: u.email })
    }
    event.memberships.forEach((m: any) => pushUser(m.user))
    event.subscriptions.forEach((s: any) => pushUser(s.user))
    if (event.club.moderator) {
      pushUser(event.club.moderator)
    }

    const base = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || '').replace(/\/$/, '')
    const cta = `${base || 'https://boook.love'}/clubs/${event.club.slug}`
    const eventDate = new Date(event.startsAt)

    let recipients: { userId: string | null; email: string | null; name: string | null }[]

    if (selectedIds && selectedIds.length > 0) {
      recipients = []

      for (const id of selectedIds) {
        const fromParticipants = participantMap.get(id)
        if (fromParticipants) {
          recipients.push(fromParticipants)
          continue
        }
        const fromOriginal = originalMail.recipients.find((rec) => rec.userId === id || rec.id === id)
        if (fromOriginal) {
          recipients.push({ userId: fromOriginal.userId, email: fromOriginal.email, name: fromOriginal.name })
        }
      }

      const seen = new Set<string>()
      recipients = recipients.filter((rec) => {
        const key = rec.userId || `email:${rec.email}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    } else {
      recipients = Array.from(participantMap.values())
    }

    const seenEmails = new Set<string>()
    const uniqueRecipients: { userId: string | null; email: string | null; name: string | null }[] = []

    recipients.forEach((r) => {
      if (!r.email) return
      const normalized = r.email.toLowerCase()
      if (seenEmails.has(normalized)) return
      seenEmails.add(normalized)
      uniqueRecipients.push(r)
    })

    extraEmails.forEach((email) => {
      const normalized = email.toLowerCase()
      if (seenEmails.has(normalized)) return
      seenEmails.add(normalized)
      uniqueRecipients.push({ userId: null, email, name: null })
    })

    recipients = uniqueRecipients
    if (!recipients.length) {
      return NextResponse.json({ error: 'Gönderilecek katılımcı bulunamadı.' }, { status: 400 })
    }

    if (recipients.length === participantMap.size) {
      await prisma.eventMail.update({ where: { id: originalMail.id }, data: { sendScope: 'ALL' } })
    } else {
      await prisma.eventMail.update({ where: { id: originalMail.id }, data: { sendScope: 'CUSTOM' } })
    }

    const results: { recipientId: string; status: string }[] = []

    for (const recipient of recipients) {
      const record = await prisma.eventMailRecipient.create({
        data: {
          mailId: originalMail.id,
          userId: recipient.userId,
          email: String(recipient.email),
          name: recipient.name || null,
          status: 'PENDING',
        },
      })

      try {
        const personalized = buildEventMail({
          clubName: event.club.name,
          eventTitle: event.title,
          eventDate,
          note: originalMail.note,
          recipientName: recipient.name,
          ctaUrl: cta,
        })
        await sendMail(String(recipient.email), personalized.subject, personalized.html)
        await prisma.eventMailRecipient.update({
          where: { id: record.id },
          data: { status: 'SENT', sentAt: new Date() },
        })
        results.push({ recipientId: record.id, status: 'SENT' })
      } catch (err: any) {
        await prisma.eventMailRecipient.update({
          where: { id: record.id },
          data: { status: 'FAILED', error: err?.message?.toString() ?? 'Gönderim hatası' },
        })
        results.push({ recipientId: record.id, status: 'FAILED' })
      }
    }

    return NextResponse.json({
      mail: {
        id: originalMail.id,
        createdAt: new Date().toISOString(),
        subject: originalMail.subject,
        note: originalMail.note,
      },
      recipients: results,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
