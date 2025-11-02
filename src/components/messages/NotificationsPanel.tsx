// src/components/messages/NotificationsPanel.tsx
'use client'

import * as React from 'react'
import Modal from '@/components/ui/modal'
import PostCard from '@/components/feed/post/PostCard'

type Row = { id: string; type: string; payload: any; read: boolean; createdAt: string }

function titleFor(n: Row): string {
  const p = n.payload || {}
  switch (n.type) {
    case 'follow':
      return `${p.byName || 'Bir kullanıcı'} seni takip etmeye başladı`
    case 'post_like':
      return `${p.byName || 'Bir kullanıcı'} Bookie'ni beğendi`
    case 'post_comment':
      return `${p.byName || 'Bir kullanıcı'} Bookie'ne yorum yaptı`
    case 'dm_message':
      return `${p.byName || 'Bir kullanıcı'} sana mesaj gönderdi`
    case 'club_moderator_post':
      return 'Moderatör yeni bir mesaj paylaştı'
    case 'club_moderator_secret':
      return 'Moderatör gizli bir mesaj paylaştı'
    case 'club_new_messages_daily':
      return 'Takip ettiğin etkinlikte yeni mesajlar var'
    case 'club_created':
      return `${p.clubName || 'Yeni kulüp'} yayında`
    case 'club_new_event':
      return `${p.clubName || 'Kulüp'} için yeni etkinlik eklendi`
    default:
      return 'Bildirim'
  }
}

export default function NotificationsPanel({ active }: { active?: boolean }) {
  const [items, setItems] = React.useState<Row[]>([])
  const [loading, setLoading] = React.useState(true)
  const [openPostId, setOpenPostId] = React.useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/notifications?limit=30', { cache: 'no-store' })
      const j = await r.json()
      if (r.ok) setItems(Array.isArray(j.items) ? j.items : [])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [])

  async function markAllRead() {
    await fetch('/api/notifications/mark-read', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ all: true }) })
    window.dispatchEvent(new Event('notif:changed'))
    await load()
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-4 font-medium text-lg font-semibold">
        <span>Bildirimler</span>
        {items.some((it) => !it.read) && (
          <button type="button" onClick={markAllRead} className="text-sm rounded-full border px-3 py-1 hover:bg-gray-50">Hepsini okundu işaretle</button>
        )}
      </div>
      <div className="max-h-[70vh] overflow-auto">
        {loading ? (
          <div className="px-3 py-3 text-sm text-gray-600">Yükleniyor…</div>
        ) : items.length === 0 ? (
          <div className="px-3 py-3 text-sm text-gray-600">Bildirim yok.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {items.map((n) => (
              <li key={n.id} className={`px-3 py-3 ${n.read ? '' : 'bg-amber-50/50'}`}>
                <div className="text-sm text-gray-800">{titleFor(n)}</div>
                {(
                  (n.type === 'post_like' || n.type === 'post_comment') && n.payload?.postId
                ) ? (
                  <button
                    type="button"
                    className="text-xs text-primary underline"
                    onClick={async () => {
                      await fetch('/api/notifications/mark-read', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: n.id }) })
                      window.dispatchEvent(new Event('notif:changed'))
                      setOpenPostId(String(n.payload.postId))
                    }}
                  >
                    Görüntüle
                  </button>
                ) : n.payload?.url ? (
                  <button
                    type="button"
                    className="text-xs text-primary underline"
                    onClick={async () => {
                      await fetch('/api/notifications/mark-read', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: n.id }) })
                      window.dispatchEvent(new Event('notif:changed'))
                      window.location.href = n.payload.url
                    }}
                  >
                    Görüntüle
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      <PostQuickView openId={openPostId} onClose={() => setOpenPostId(null)} />
    </div>
  )}

function PostQuickView({ openId, onClose }: { openId: string | null; onClose: () => void }) {
  const [loading, setLoading] = React.useState(false)
  const [post, setPost] = React.useState<any | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!openId) return
    setLoading(true); setError(null); setPost(null)
    ;(async () => {
      try {
        const r = await fetch(`/api/posts/${openId}`, { cache: 'no-store' })
        const j = await r.json()
        if (!r.ok) throw new Error(j?.error || 'Gönderi yüklenemedi')
        setPost(j)
      } catch (e: any) {
        setError(e?.message || 'Gönderi yüklenemedi')
      } finally {
        setLoading(false)
      }
    })()
  }, [openId])

  return (
    <Modal open={!!openId} onClose={onClose} title="Gönderi">
      {loading && <div className="text-sm text-gray-600">Yükleniyor…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {post && (
        <div className="space-y-3">
          {/* reuse PostCard for full interactions */}
          <PostCard post={normalize(post)} />
        </div>
      )}
    </Modal>
  )
}

function normalize(p: any) {
  return {
    id: String(p.id),
    body: String(p.body || ''),
    createdAt: String(p.createdAt || new Date().toISOString()),
    status: (p.status as any) || 'PUBLISHED',
    owner: {
      id: p.owner?.id || '',
      name: p.owner?.name || 'Kullanıcı',
      username: p.owner?.username || null,
      slug: p.owner?.slug || null,
      avatarUrl: p.owner?.avatarUrl || null,
    },
    images: Array.isArray(p.images)
      ? p.images.map((i: any) => ({ url: String(i.url || ''), width: i.width ?? null, height: i.height ?? null }))
      : [],
    counts: { likes: Number(p.counts?.likes || 0), comments: Number(p.counts?.comments || 0) },
  }
}
