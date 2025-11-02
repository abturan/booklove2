// src/lib/notify-email.ts
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/mail'
import { renderEmail, escapeHtml } from '@/lib/emailTemplates'
import type { NotificationType } from '@/lib/notify'

export async function sendNotificationEmail(userId: string, type: NotificationType, payload: Record<string, any> = {}) {
  try {
    const pref = await (prisma as any).notificationPreference.findUnique({ where: { userId } })
    if (pref) {
      const disabled =
        (type === 'follow' && !pref.emailFollow) ||
        (type === 'post_like' && !pref.emailPostLike) ||
        (type === 'post_comment' && !pref.emailPostComment) ||
        (type === 'club_moderator_post' && !pref.emailClubModeratorPost) ||
        (type === 'club_moderator_secret' && !pref.emailClubModeratorSecret) ||
        (type === 'club_new_messages_daily' && !pref.emailClubNewMessagesDaily) ||
        (type === 'club_created' && !pref.emailClubCreated) ||
        (type === 'club_new_event' && !pref.emailClubNewEvent)
      if (disabled) return
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
    if (!user?.email) return
    const { subject, html } = await buildEmail(type, payload)
    if (!subject) return
    await sendMail(user.email, subject, html)
  } catch (err) {
    console.error('sendNotificationEmail failed', err)
  }
}

async function buildEmail(type: NotificationType, payload: Record<string, any>) {
  const byUser = payload.byId
    ? await prisma.user.findUnique({ where: { id: String(payload.byId) }, select: { name: true, username: true } })
    : null
  const byName = byUser?.name || 'Bir kullanıcı'
  const clubName = payload.clubName || payload.club?.name || 'Kulüp'
  const url = absUrl(payload.url || '#')

  switch (type) {
    case 'follow':
      return wrap(`${byName} seni takip etmeye başladı`, `
        <p>Merhaba,</p>
        <p><strong>${escapeHtml(byName)}</strong> seni takip etmeye başladı.</p>
      `, 'Profili gör', url)
    case 'post_like': {
      const post = payload.postId
        ? await prisma.post.findUnique({
            where: { id: String(payload.postId) },
            select: { body: true, createdAt: true },
          })
        : null
      const snippet = makeSnippet(post?.body || '')
      const heading = `${byName} Bookie'nı beğendi`
      const html = `
        <p>Merhaba,</p>
        <p><strong>${escapeHtml(byName)}</strong> paylaştığın Bookie'yi beğendi.</p>
        ${contentCard(snippet)}
      `
      return wrap(heading, html)
    }
    case 'post_comment': {
      const [post, comment] = await Promise.all([
        payload.postId
          ? prisma.post.findUnique({ where: { id: String(payload.postId) }, select: { body: true, createdAt: true } })
          : Promise.resolve(null),
        payload.commentId
          ? prisma.comment.findUnique({ where: { id: String(payload.commentId) }, select: { body: true, createdAt: true } })
          : Promise.resolve(null),
      ])
      const postSnippet = makeSnippet(post?.body || '')
      const commentSnippet = makeSnippet(comment?.body || '')
      const heading = `${byName} Bookie'ne yorum yaptı`
      const html = `
        <p>Merhaba,</p>
        <p><strong>${escapeHtml(byName)}</strong> paylaştığın Bookie'ye yorum yaptı.</p>
        ${commentSnippet ? labeledCard('Yorum', commentSnippet) : ''}
        ${postSnippet ? labeledCard('Gönderi', postSnippet) : ''}
      `
      return wrap(heading, html)
    }
    case 'club_moderator_post': {
      const heading = `${clubName} — Moderatörden yeni mesaj`
      const snippet = makeSnippet(String(payload.body || ''))
      const html = `
        <p>Merhaba,</p>
        <p><strong>${escapeHtml(clubName)}</strong> etkinliğinde moderatör yeni bir mesaj paylaştı.</p>
        ${snippet ? labeledCard('Mesaj', snippet) : ''}
      `
      return wrap(heading, html)
    }
    case 'club_moderator_secret': {
      const heading = `${clubName} — Moderatörden gizli mesaj`
      const snippet = makeSnippet(String(payload.body || ''))
      const html = `
        <p>Merhaba,</p>
        <p><strong>${escapeHtml(clubName)}</strong> etkinliğinde moderatör gizli bir mesaj paylaştı.</p>
        ${snippet ? labeledCard('Mesaj', snippet) : ''}
      `
      return wrap(heading, html)
    }
    case 'club_new_messages_daily':
      return wrap(`${clubName} — Yeni mesajlar var`, `
        <p>Merhaba,</p>
        <p><strong>${escapeHtml(clubName)}</strong> etkinliğinde yeni mesajlar var.</p>
      `, 'Sohbete git', url)
    case 'club_created':
      return wrap(`Yeni kulüp: ${clubName}`, `
        <p>Merhaba,</p>
        <p><strong>${escapeHtml(clubName)}</strong> yayında.</p>
      `, 'Kulübü incele', url)
    case 'club_new_event':
      return wrap(`${clubName} kulübünde yeni etkinlik`, `
        <p>Merhaba,</p>
        <p><strong>${escapeHtml(clubName)}</strong> kulübünde yeni bir etkinlik eklendi.</p>
      `, 'Etkinliğe göz at', url)
    case 'dm_message': {
      const snippet = makeSnippet(String(payload.body || ''))
      const heading = `${byName} sana mesaj gönderdi`
      const html = `
        <p>Merhaba,</p>
        <p><strong>${escapeHtml(byName)}</strong> sana bir mesaj gönderdi.</p>
        ${snippet ? labeledCard('Mesaj', snippet) : ''}
      `
      // DM e-postasında bağlantı istemiyoruz; CTA yok
      return wrap(heading, html)
    }
    default:
      return { subject: '', html: '' }
  }
}

function wrap(subject: string, body: string, ctaLabel?: string, ctaUrl?: string) {
  return { subject, html: renderEmail({ title: subject, bodyHtml: body, ctaLabel, ctaUrl }) }
}

function absUrl(u: string) {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_ORIGIN || ''
    if (!base) return u
    const url = new URL(u, base)
    return url.toString()
  } catch {
    return u
  }
}

function makeSnippet(body: string, max = 300) {
  const txt = (body || '').trim()
  if (!txt) return ''
  const safe = escapeHtml(txt)
  return safe.length > max ? safe.slice(0, max) + '…' : safe
}

const brand = '#fa3d30'
function contentCard(content: string) {
  if (!content) return ''
  return `
    <div style="margin-top:12px;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;background:#fff">
      <div style="border-left:3px solid ${brand};padding-left:10px;color:#374151;white-space:pre-wrap;word-break:break-word;font-size:14px;line-height:1.6">${content}</div>
    </div>
  `
}

function labeledCard(label: string, content: string) {
  if (!content) return ''
  return `
    <div style="margin-top:12px;border:1px solid #e5e7eb;border-radius:12px;background:#fff">
      <div style="font-size:12px;color:#6b7280;padding:8px 12px;border-bottom:1px solid #f3f4f6">${escapeHtml(label)}</div>
      <div style="padding:12px 14px;border-left:3px solid ${brand};margin:12px;color:#374151;white-space:pre-wrap;word-break:break-word;font-size:14px;line-height:1.6">${content}</div>
    </div>
  `
}
