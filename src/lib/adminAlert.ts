// src/lib/adminAlert.ts
// Lightweight admin alert sender (Slack Incoming Webhook)

type Level = 'info' | 'warn' | 'error'
import { prisma } from '@/lib/prisma'

const HOOK = process.env.ADMIN_ALERTS_SLACK_WEBHOOK || process.env.ADMIN_SLACK_WEBHOOK || ''
const ENABLED = !!HOOK && (process.env.ADMIN_ALERTS_ENABLED ?? '1') !== '0'

function truncate(s: string, n = 400) {
  const t = String(s || '')
  if (t.length <= n) return t
  return t.slice(0, n - 1) + '…'
}

export async function adminAlert(subject: string, fields?: Record<string, any>, level: Level = 'info') {
  try {
    if (!ENABLED) return
    const textLines: string[] = []
    textLines.push(`*${subject}*`)
    if (fields) {
      for (const [k, v] of Object.entries(fields)) {
        const val = typeof v === 'string' ? v : JSON.stringify(v)
        textLines.push(`• *${k}:* ${truncate(val, 600)}`)
      }
    }
    const color = level === 'error' ? '#ef4444' : level === 'warn' ? '#f59e0b' : '#10b981'
    const payload = {
      attachments: [
        {
          color,
          mrkdwn_in: ['text'],
          text: textLines.join('\n'),
        },
      ],
    }
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : undefined
    const t = setTimeout(() => ac?.abort(), 1500)
    await fetch(HOOK, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ac?.signal,
    }).catch(() => {})
    clearTimeout(t)
  } catch {}
}

// Convenience helpers
export async function alertUserRegistered(user: { id: string; name?: string | null; email?: string | null; username?: string | null }) {
  return adminAlert('Yeni üye kaydı', {
    id: user.id,
    name: user.name || '',
    username: user.username || '',
    email: user.email || '',
  })
}

export async function alertPostCreated(data: { userId: string; postId: string; body: string; images?: number }) {
  const u = await safeUser(data.userId)
  const url = buildPostUrl(data.postId)
  return adminAlert('Yeni paylaşım', {
    user: u.label,
    profile: u.url,
    post: url,
    body: truncate(data.body, 600),
    images: String(data.images || 0),
  })
}

export async function alertComment(data: { userId: string; postId: string; ownerId?: string; commentId: string; body: string }) {
  const u = await safeUser(data.userId)
  const owner = data.ownerId ? await safeUser(data.ownerId) : await postOwner(data.postId)
  const postBody = await postSnippet(data.postId)
  return adminAlert('Yeni yorum', {
    yorumYapan: u.label,
    profil: u.url,
    gonderi: buildPostUrl(data.postId),
    gonderiSahibi: owner?.label || '',
    gonderiIcerik: postBody,
    body: truncate(data.body, 600),
  })
}

export async function alertLike(data: { userId: string; postId: string; ownerId?: string }) {
  const u = await safeUser(data.userId)
  const owner = data.ownerId ? await safeUser(data.ownerId) : await postOwner(data.postId)
  const postBody = await postSnippet(data.postId)
  return adminAlert('Beğeni', {
    begenen: u.label,
    profil: u.url,
    gonderi: buildPostUrl(data.postId),
    gonderiSahibi: owner?.label || '',
    gonderiIcerik: postBody,
  })
}

export async function alertChatMessage(data: { userId: string; clubId: string; eventId: string; clubName?: string; body: string; isSecret?: boolean }) {
  const u = await safeUser(data.userId)
  const ce = await safeClubEvent(data.eventId)
  return adminAlert('Kulüp sohbet mesajı', {
    yazar: u.label,
    profil: u.url,
    kulup: ce?.clubName || data.clubName || data.clubId,
    etkinlik: ce?.eventTitle || data.eventId,
    body: truncate(data.body, 600),
    gizli: String(!!data.isSecret),
  })
}

export async function alertDmMessage(data: { fromUserId: string; toUserId: string; messageId: string; body: string }) {
  const fromU = await safeUser(data.fromUserId)
  const toU = await safeUser(data.toUserId)
  return adminAlert('DM mesajı', {
    gonderen: fromU.label,
    gonderenProfil: fromU.url,
    alici: toU.label,
    aliciProfil: toU.url,
    body: truncate(data.body, 600),
  })
}

export async function alertTicket(data: { userId: string; clubId: string; eventId: string; amountTRY: number; status: string; merchantOid: string }) {
  const u = await safeUser(data.userId)
  const ce = await safeClubEvent(data.eventId)
  return adminAlert('Bilet işlemi', {
    kullanici: u.label,
    profil: u.url,
    durum: data.status,
    tutarTRY: String(data.amountTRY),
    kulup: ce?.clubName || data.clubId,
    etkinlik: ce?.eventTitle || data.eventId,
    oid: data.merchantOid,
  }, data.status === 'SUCCEEDED' ? 'info' : 'warn')
}

export async function alertError(topic: string, err: unknown, extra?: Record<string, any>) {
  const e = err as any
  const fields = { message: String(e?.message || e || 'Unknown'), ...(extra || {}) }
  return adminAlert(`HATA: ${topic}`, fields, 'error')
}

// ---------- helpers for enrichment ----------
async function safeUser(id: string | null | undefined): Promise<{ label: string; url: string }> {
  try {
    if (!id) return { label: '—', url: '' }
    const u = await prisma.user.findUnique({ where: { id }, select: { name: true, username: true, slug: true } })
    const handle = u?.username || u?.slug || (id || '').slice(0, 6)
    const label = `${u?.name || 'Kullanıcı'} (@${handle})`
    return { label, url: buildProfileUrl(handle) }
  } catch {
    return { label: String(id), url: '' }
  }
}

async function postOwner(postId: string | null | undefined): Promise<{ label: string; url: string } | null> {
  try {
    if (!postId) return null
    const p = await prisma.post.findUnique({ where: { id: postId }, select: { owner: { select: { id: true, name: true, username: true, slug: true } } } })
    if (!p?.owner) return null
    const handle = p.owner.username || p.owner.slug || (p.owner.id || '').slice(0,6)
    return { label: `${p.owner.name || 'Kullanıcı'} (@${handle})`, url: buildProfileUrl(handle) }
  } catch { return null }
}

async function postSnippet(postId: string | null | undefined): Promise<string> {
  try {
    if (!postId) return ''
    const p = await prisma.post.findUnique({ where: { id: postId }, select: { body: true } })
    if (!p?.body) return ''
    return truncate(String(p.body), 600)
  } catch { return '' }
}

async function safeClubEvent(eventId: string | null | undefined): Promise<{ clubName: string; eventTitle: string } | null> {
  try {
    if (!eventId) return null
    const row = await prisma.clubEvent.findUnique({ where: { id: String(eventId) }, select: { title: true, club: { select: { name: true } } } })
    if (!row) return null
    return { clubName: row.club?.name || 'Kulüp', eventTitle: row.title || 'Etkinlik' }
  } catch { return null }
}

function buildBase(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_ORIGIN || ''
  return base.replace(/\/$/, '')
}
function buildProfileUrl(handle: string) { return `${buildBase()}/u/${handle}` }
function buildPostUrl(postId: string) { return `${buildBase()}/?focus=${encodeURIComponent(postId)}` }
