// src/components/feed/post/PostCard.tsx
'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import type { Post } from './types'
import PostHeader from './PostHeader'
import PostBody from './PostBody'
import PostImages from './PostImages'
import PostActions from './PostActions'
import PostComments from './PostComments'
import PostEditor from './PostEditor'
import { useComments } from './hooks/useComments'
import { useEdit } from './hooks/useEdit'
import { useLike } from './hooks/useLike'

export default function PostCard({ post, onUpdated, onDeleted }: { post: Post; onUpdated?: (p: Post)=>void; onDeleted?: (id:string)=>void }) {
  const { data } = useSession()
  const meId = data?.user?.id
  const isOwner = !!meId && meId === post.owner.id
  const canInteract = !!meId
  const isAdmin = (data?.user as any)?.role === 'ADMIN'
  const like = useLike(post.id, Number(post.counts?.likes || 0), canInteract)
  const c = useComments(post.id)
  const ed = useEdit(post, onUpdated, onDeleted)
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
      const nextStatus = j?.post?.status ?? post.status
      onUpdated?.({ ...post, status: nextStatus })
    } catch {
    } finally {
      setBusy(null)
    }
  }

  const statusTR =
    post.status === 'PUBLISHED' ? 'Yayında' :
    post.status === 'PENDING' ? 'Beklemede' :
    post.status === 'HIDDEN' ? 'Gizli' : null

  return (
    <div className="card p-3">
      <PostHeader
        post={post}
        isOwner={!!isOwner}
        isAdmin={!!isAdmin}
        editing={ed.editing}
        onEdit={() => {}}
        onDelete={() => {}}
      />

      {!ed.editing && (
        <>
          <PostBody text={post.body} />
          <PostImages images={post.images} />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {statusTR && (
              <span className="rounded-full border px-2 py-0.5 text-[10px] tracking-wide text-gray-600">
                {statusTR}
              </span>
            )}

            {isAdmin && (
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

            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => { ed.setEditText(post.body); ed.setEditImages(post.images || []); ed.setEditing(true) }}
                  className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => { void ed.del() }}
                  className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50"
                >
                  Sil
                </button>
              </>
            )}
          </div>

          <PostActions
            likeCount={like.count}
            onToggleLike={like.toggle}
            onToggleComments={() => { c.setOpen(!c.open); if (!c.open) c.load() }}
            canInteract={canInteract}
          />
          <PostComments
            open={c.open}
            loading={c.loading}
            items={c.items}
            text={c.text}
            setText={c.setText}
            onSend={c.send}
            canInteract={canInteract}
          />
        </>
      )}

      {ed.editing && (
        <PostEditor
          text={ed.editText}
          setText={ed.setEditText}
          images={ed.editImages as any}
          onRemove={ed.removeEditImage}
          fileRef={ed.fileRef}
          onPick={ed.addEditImages}
          onSave={ed.save}
          onCancel={() => ed.setEditing(false)}
        />
      )}
    </div>
  )
}






