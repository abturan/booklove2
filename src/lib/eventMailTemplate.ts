// src/lib/eventMailTemplate.ts
import { renderEmail, escapeHtml } from '@/lib/emailTemplates'

const MAIL_TIME_ZONE = 'Europe/Istanbul'

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: MAIL_TIME_ZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: MAIL_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function sanitizeNote(note?: string | null) {
  if (!note) return ''
  const safe = escapeHtml(note)
  return safe.replace(/\r?\n/g, '<br/>')
}

export function buildEventMail({
  clubName,
  eventTitle,
  eventDate,
  note,
  recipientName,
  ctaUrl,
}: {
  clubName: string
  eventTitle: string
  eventDate: Date
  note?: string | null
  recipientName?: string | null
  ctaUrl: string
}) {
  const greetingName = recipientName ? escapeHtml(recipientName) : 'Book.love üyesi'
  const dateLabel = formatDate(eventDate)
  const timeLabel = formatTime(eventDate)
  const safeNote = sanitizeNote(note)

  const paragraphs = [
    `Merhaba ${greetingName},`,
    `${escapeHtml(clubName)} kulübünün "${escapeHtml(eventTitle)}" etkinliğine kayıtlısınız.`,
    `Etkinlik ${escapeHtml(dateLabel)} tarihinde, saat ${escapeHtml(timeLabel)}'de gerçekleşecek.`,
    safeNote ? safeNote : null,
    'Sevgiyle,<br/>Book.love ekibi',
  ].filter(Boolean)

  const bodyHtml = paragraphs
    .map((p) => (p?.startsWith('Sevgiyle') ? `<p style="margin:24px 0 0 0;">${p}</p>` : `<p style="margin:0 0 16px 0;">${p}</p>`))
    .join('')

  const html = renderEmail({
    title: `${clubName} · ${eventTitle}`,
    bodyHtml,
    ctaLabel: 'Etkinlik sayfasını aç',
    ctaUrl,
  })

  const subject = `${clubName} · ${eventTitle}`
  const previewText = `${clubName} etkinliği ${dateLabel} — ${timeLabel}`

  return { subject, html, previewText }
}
