// src/lib/notify.ts
import { prisma } from '@/lib/prisma'

export type NotificationType =
  | 'follow'
  | 'post_like'
  | 'post_comment'
  | 'post_comment_reply'
  | 'comment_like'
  | 'club_moderator_post'
  | 'club_moderator_secret'
  | 'club_new_messages_daily'
  | 'club_created'
  | 'club_new_event'
  | 'club_membership_joined'
  | 'dm_message'

export async function createNotification(opts: {
  userId: string
  type: NotificationType
  payload?: Record<string, any>
}) {
  // Enrich payload with byName if byId is present (for nicer UI titles)
  let data: Record<string, any> = opts.payload ? { ...opts.payload } : {}
  try {
    if (data && data.byId && !data.byName) {
      const u = await prisma.user.findUnique({ where: { id: String(data.byId) }, select: { name: true } })
      if (u?.name) data.byName = u.name
    }
  } catch {}
  const payload = JSON.stringify(data)
  const pref = await (prisma as any).notificationPreference.findUnique({ where: { userId: opts.userId } })
  if (pref) {
    if (
      (opts.type === 'follow' && !pref.emailFollow) ||
      (opts.type === 'post_like' && !pref.emailPostLike) ||
      (opts.type === 'post_comment' && !pref.emailPostComment) ||
      (opts.type === 'club_moderator_post' && !pref.emailClubModeratorPost) ||
      (opts.type === 'club_moderator_secret' && !pref.emailClubModeratorSecret) ||
      (opts.type === 'club_new_messages_daily' && !pref.emailClubNewMessagesDaily) ||
      (opts.type === 'club_created' && !pref.emailClubCreated) ||
      (opts.type === 'club_new_event' && !pref.emailClubNewEvent)
    ) {
      // still create in-app notification regardless? We'll still save, prefs apply only to email.
    }
  }
  return prisma.notification.create({
    data: { userId: opts.userId, type: opts.type, payload },
  })
}

export async function unreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } })
}

export async function listNotifications(userId: string, limit = 20, page = 1) {
  const skip = Math.max((page - 1) * limit, 0)
  const items = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip,
    select: { id: true, type: true, payload: true, readAt: true, createdAt: true },
  })
  return items.map((n) => ({
    id: n.id,
    type: n.type as NotificationType,
    payload: safeJson(n.payload),
    read: n.readAt != null,
    createdAt: n.createdAt.toISOString(),
  }))
}

export async function markRead(opts: { userId: string; id?: string; all?: boolean }) {
  if (opts.all) {
    await prisma.notification.updateMany({ where: { userId: opts.userId, readAt: null }, data: { readAt: new Date() } })
    return { ok: true }
  }
  if (opts.id) {
    await prisma.notification.updateMany({ where: { id: opts.id, userId: opts.userId, readAt: null }, data: { readAt: new Date() } })
    return { ok: true }
  }
  return { ok: false }
}

function safeJson(s: string | null): Record<string, any> {
  try { return s ? JSON.parse(s) : {} } catch { return {} }
}
