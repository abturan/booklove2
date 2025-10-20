// src/components/feed/post/PostHeader.tsx
import Avatar from '@/components/Avatar'
import Link from 'next/link'
import { userPath } from '@/lib/userPath'
import { timeAgo } from './utils/timeAgo'
import type { Post } from './types'
import { useState } from 'react'

export default function PostHeader({
  post,
  isOwner,
  isAdmin,
  editing,
  onEdit,
  onDelete,
  onModerated,
}: {
  post: Post
  isOwner: boolean
  isAdmin: boolean
  editing: boolean
  onEdit: () => void
  onDelete: () => void
  onModerated?: (status: Post['status']) => void
}) {
  const [busy, setBusy] = useState<'publish' | 'hide' | 'pending' | null>(null)

  async function moderate(action: 'publish' | 'hide' | 'pending') {
    if (busy) return
    setBusy(action)
    try {
      const res = await fetch(`/api/posts/${post.id}/moderate`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok) throw new Error(j?.error || 'İşlem başarısız')
      onModerated?.(j?.post?.status ?? null)
    } catch {
      /* sessizce geç */
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-start gap-3">
      <Avatar src={post.owner.avatarUrl || undefined} size={36} alt={post.owner.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={userPath(post.owner.username, post.owner.name, post.owner.slug)} className="font-medium hover:underline">
            {post.owner.name}
          </Link>
          {post.owner.username && <span className="text-xs text-gray-500">@{post.owner.username}</span>}
          <span className="text-xs text-gray-400">· {timeAgo(post.createdAt)}</span>
          {post.status && (
            <span className="ml-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-600">
              {post.status}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {isOwner && !editing && (
              <>
                <button type="button" onClick={onEdit} className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50">Düzenle</button>
                <button type="button" onClick={onDelete} className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50">Sil</button>
              </>
            )}
            {isAdmin && !editing && (
              <>
                <button
                  type="button"
                  onClick={() => moderate('publish')}
                  disabled={busy !== null}
                  className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50 disabled:opacity-60"
                  title="Yayınla"
                >
                  {busy === 'publish' ? '...' : 'Yayınla'}
                </button>
                <button
                  type="button"
                  onClick={() => moderate('pending')}
                  disabled={busy !== null}
                  className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50 disabled:opacity-60"
                  title="Beklemeye al"
                >
                  {busy === 'pending' ? '...' : 'Beklet'}
                </button>
                <button
                  type="button"
                  onClick={() => moderate('hide')}
                  disabled={busy !== null}
                  className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50 disabled:opacity-60"
                  title="Gizle"
                >
                  {busy === 'hide' ? '...' : 'Gizle'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
