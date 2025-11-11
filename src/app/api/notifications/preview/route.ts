// src/app/api/notifications/preview/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { NotificationType } from '@/lib/notify'
import { renderEmail } from '@/lib/emailTemplates'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = (searchParams.get('type') as NotificationType) || 'post_like'
  const url = searchParams.get('url') || 'https://book.love'
  const sample = makeSample(type, url)
  const html = renderEmail(sample)
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}

function makeSample(type: NotificationType, url: string) {
  switch (type) {
    case 'follow':
      return { title: 'Yeni takipçi', bodyHtml: '<p><b>Ahmet</b> seni takip etmeye başladı.</p>', ctaLabel: 'Profili gör', ctaUrl: url }
    case 'post_like':
      return { title: "Bookie'ne beğeni", bodyHtml: "<p><b>Ayşe</b> Bookie'ni beğendi.</p>", ctaLabel: 'Gönderiyi gör', ctaUrl: url }
    case 'post_comment':
      return { title: "Bookie'ne yorum", bodyHtml: "<p><b>Ayşe</b> Bookie'ne yorum yaptı.</p>", ctaLabel: 'Yorumu gör', ctaUrl: url }
    case 'post_comment_reply':
      return { title: "Bookie'nde yeni yorum", bodyHtml: "<p><b>Ayşe</b> takip ettiğin Bookie'ye yanıt verdi.</p>", ctaLabel: 'Gönderiyi aç', ctaUrl: url }
    case 'club_moderator_post':
      return { title: 'Moderatörden yeni mesaj', bodyHtml: '<p>Moderatör yeni bir mesaj paylaştı.</p>', ctaLabel: 'Sohbete git', ctaUrl: url }
    case 'club_moderator_secret':
      return { title: 'Moderatörden gizli mesaj', bodyHtml: '<p>Moderatör gizli bir mesaj paylaştı.</p>', ctaLabel: 'Sohbete git', ctaUrl: url }
    case 'club_new_messages_daily':
      return { title: 'Yeni mesajlar var', bodyHtml: '<p>Etkinliğinde yeni mesajlar var.</p>', ctaLabel: 'Sohbete git', ctaUrl: url }
    case 'club_created':
      return { title: 'Yeni kulüp', bodyHtml: '<p>Yeni bir kulüp yayında.</p>', ctaLabel: 'Kulübü incele', ctaUrl: url }
    case 'club_new_event':
      return { title: 'Yeni etkinlik', bodyHtml: '<p>Kulübünde yeni bir etkinlik eklendi.</p>', ctaLabel: 'Etkinliği gör', ctaUrl: url }
    case 'club_membership_joined':
      return { title: 'Katılım onaylandı', bodyHtml: '<p>Seçtiğin kulübün etkinliğine katıldın. Oturum saatinde konferans odası açılacak.</p>', ctaLabel: 'Kulüp sayfası', ctaUrl: url }
    case 'dm_message':
      return { title: 'Yeni mesaj', bodyHtml: '<p><b>Ayşe</b> sana mesaj gönderdi.</p>', ctaLabel: 'Mesajı gör', ctaUrl: url }
    default:
      return { title: 'Bildirim', bodyHtml: '<p>Örnek içerik</p>', ctaLabel: 'Siteye git', ctaUrl: url }
  }
}
