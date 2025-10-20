// src/components/feed/post/PostCard.tsx
'use client'

import { useSession } from 'next-auth/react'
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
  const like = useLike(post.id, Number(post.counts?.likes || 0), canInteract)
  const c = useComments(post.id)
  const ed = useEdit(post, onUpdated, onDeleted)
  return (
    <div className="card p-3">
      <PostHeader post={post} isOwner={!!isOwner} editing={ed.editing} onEdit={()=>{ed.setEditText(post.body); ed.setEditImages(post.images||[]); ed.setEditing(true)}} onDelete={ed.del} />
      {!ed.editing && (
        <>
          <PostBody text={post.body} />
          <PostImages images={post.images} />
          <PostActions likeCount={like.count} onToggleLike={like.toggle} onToggleComments={()=>{ c.setOpen(!c.open); if (!c.open) c.load() }} canInteract={canInteract} />
          <PostComments open={c.open} loading={c.loading} items={c.items} text={c.text} setText={c.setText} onSend={c.send} canInteract={canInteract} />
        </>
      )}
      {ed.editing && (
        <PostEditor text={ed.editText} setText={ed.setEditText} images={ed.editImages as any} onRemove={ed.removeEditImage} fileRef={ed.fileRef} onPick={ed.addEditImages} onSave={ed.save} onCancel={()=>ed.setEditing(false)} />
      )}
    </div>
  )
}
