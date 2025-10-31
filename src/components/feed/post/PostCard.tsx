// src/components/feed/post/PostCard.tsx
'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import type { Post } from './types'
import PostHeader from './PostHeader'
import PostBody from './PostBody'
import PostImages from './PostImages'
import PostActions from './PostActions'
import PostComments from './PostComments'
import PostEditor from './PostEditor'
import PostShareButton from './PostShareButton'
import { useComments } from './hooks/useComments'
import { useEdit } from './hooks/useEdit'
import { useLike } from './hooks/useLike'
import BareModal from '@/components/ui/BareModal'
import Modal from '@/components/ui/modal'
import LikeListModal from './LikeListModal'

const REPORT_OPTIONS = ['Spam','Nefret söylemi','Taciz','Müstehcen içerik','Dolandırıcılık','Diğer']

export default function PostCard({ post, onUpdated, onDeleted }: { post: Post; onUpdated?: (p: Post)=>void; onDeleted?: (id:string)=>void }) {
  const { data } = useSession()
  const canInteract = !!data?.user
  const meId = (data?.user as any)?.id || null
  const isOwner = !!meId && meId === post.owner.id
  const isAdmin = (data?.user as any)?.role === 'ADMIN'

  const like = useLike(post.id, Number(post.counts?.likes || 0), canInteract)
  const c = useComments(post.id)
  const ed = useEdit(post, onUpdated, onDeleted)

  const [busy, setBusy] = useState<'publish' | 'hide' | 'pending' | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [reporting, setReporting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [likersOpen, setLikersOpen] = useState(false)
  const [reportedBanner, setReportedBanner] = useState(false)

  useEffect(() => {
    if ((post.counts as any)?.comments > 0 && !c.open) {
      c.setOpen(true)
      c.load()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    } finally {
      setBusy(null)
    }
  }

  async function sendReport() {
    if (reporting || picked.length === 0) return
    setReporting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/report`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reasons: picked }),
      })
      if (!res.ok) throw new Error('Raporlama başarısız')
      setReportOpen(false)
      setPicked([])
      setReportedBanner(true)
      setTimeout(() => setReportedBanner(false), 4000)
      // Kullanıcı için gönderiyi gizlemiyoruz, admin panelinde zaten görünecek.
      onUpdated?.({ ...post, status: 'REPORTED' as any })
    } finally {
      setReporting(false)
    }
  }

  const statusTR =
    post.status === 'PUBLISHED' ? 'Yayında' :
    post.status === 'PENDING' ? 'Beklemede' :
    post.status === 'HIDDEN' ? 'Gizli' :
    (post.status as any) === 'REPORTED' ? 'Şikayette' :
    null

  const commentCountForBadge = c.open ? c.items.length : Number((post.counts as any)?.comments || 0)

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

      {reportedBanner && (
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Şikayetin alındı. Moderatör en kısa sürede inceleyecek.
        </div>
      )}

      {!ed.editing && (
        <>
          <PostBody text={post.body} />
          <PostImages images={post.images} />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {statusTR && isAdmin && (
              <span className="rounded-full border px-2 py-0.5 text-[10px] tracking-wide text-gray-600">
                {statusTR}
              </span>
            )}

            {isAdmin && (
              <>
                <button type="button" onClick={() => moderate('publish')} disabled={busy !== null} className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50 disabled:opacity-60">Yayınla</button>
                <button type="button" onClick={() => moderate('pending')} disabled={busy !== null} className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50 disabled:opacity-60">Beklet</button>
                <button type="button" onClick={() => moderate('hide')} disabled={busy !== null} className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50 disabled:opacity-60">Gizle</button>
              </>
            )}

            {!isOwner && canInteract && (
              <button type="button" onClick={() => setReportOpen(true)} className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50">Bildir</button>
            )}

            {isOwner && (
              <>
                <button type="button" onClick={() => { ed.setEditText(post.body); ed.setEditImages(post.images || []); ed.setEditing(true) }} className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50">Düzenle</button>
                <button type="button" onClick={() => setDeleteOpen(true)} className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50">Sil</button>
              </>
            )}
          </div>

          <PostActions
            liked={like.liked}
            likeCount={like.count}
            commentCount={commentCountForBadge}
            onToggleLike={like.toggle}
            onShowLikers={() => setLikersOpen(true)}
            onToggleComments={() => { c.setOpen(!c.open); if (!c.open) c.load() }}
            canInteract={canInteract}
            shareSlot={
              <PostShareButton
                postId={post.id}
                body={post.body}
                owner={{ id: post.owner.id, name: post.owner.name, username: post.owner.username, slug: post.owner.slug }}
                images={post.images}
                canInstagramShare={isAdmin}
              />
            }
          />

          <PostComments
            open={c.open}
            loading={c.loading}
            items={c.items}
            text={c.text}
            setText={c.setText}
            onSend={async () => {
              await c.send()
              // yorum sayısı badge'i anında güncellensin
            }}
            canInteract={canInteract}
          />
        </>
      )}

      {ed.editing && (
        <PostEditor
          text={ed.editText}
          setText={ed.setEditText}
          images={ed.editImages}
          onRemove={ed.removeEditImage}
          fileRef={ed.fileRef}
          onPick={ed.addEditImages}
          onSave={ed.save}
          onCancel={() => ed.setEditing(false)}
        />
      )}

      <BareModal open={reportOpen} onClose={() => setReportOpen(false)} title="Gönderiyi bildir">
        <div className="space-y-3">
          <div className="text-sm text-gray-600">Lütfen şikayet sebebini seçin:</div>
          <div className="grid grid-cols-2 gap-2">
            {REPORT_OPTIONS.map(opt => {
              const on = picked.includes(opt)
              return (
                <button key={opt} type="button" onClick={() => setPicked(on ? picked.filter(p => p!==opt) : [...picked, opt])} className={`rounded-xl border px-3 py-2 text-sm text-left ${on ? 'bg-rose-50 border-rose-200' : 'hover:bg-gray-50'}`}>
                  {opt}
                </button>
              )
            })}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setReportOpen(false)} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Vazgeç</button>
            <button onClick={sendReport} disabled={reporting || picked.length===0} className="rounded-xl bg-rose-600 text-white px-4 py-2 text-sm hover:bg-rose-700 disabled:opacity-60">
              {reporting ? 'Gönderiliyor…' : 'Bildir'}
            </button>
          </div>
        </div>
      </BareModal>

      <BareModal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Gönderiyi sil">
        <div className="space-y-4">
          <div className="text-sm text-gray-700">Gönderiyi silmek istediğine emin misin? Bu işlem geri alınamaz.</div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteOpen(false)} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Vazgeç</button>
            <button onClick={() => { setDeleteOpen(false); void ed.del() }} className="rounded-xl bg-rose-600 text-white px-4 py-2 text-sm hover:bg-rose-700">Evet, sil</button>
          </div>
        </div>
      </BareModal>

      <Modal open={likersOpen} onClose={() => setLikersOpen(false)} title="Beğenenler">
        <LikeListModal postId={post.id} />
      </Modal>
    </div>
  )
}
