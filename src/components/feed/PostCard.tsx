// src/components/feed/PostCard.tsx
'use client'

import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

export type Post = {
  id: string
  body: string
  createdAt: string
  owner: { id: string; name: string; username: string | null; avatarUrl: string | null }
  images: { url: string; width: number | null; height: number | null }[]
  counts: { likes: number; comments: number }
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime()
  const diff = Math.max(0, Date.now() - d)
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}dk`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}s`
  const day = Math.floor(h / 24)
  if (day < 7) return `${day}g`
  const w = Math.floor(day / 7)
  return `${w}h`
}

function linkify(text: string) {
  const parts = text.split(/(\B@[a-zA-Z0-9_]+)/g)
  return parts.map((p, i) => {
    if (p.startsWith('@') && p.length > 1) {
      const slug = p.slice(1)
      return (
        <Link key={i} href={userPath(slug, slug)} className="text-rose-600 hover:underline">
          {p}
        </Link>
      )
    }
    return <span key={i}>{p}</span>
  })
}

export default function PostCard({
  post,
  onUpdated,
  onDeleted,
}: {
  post: Post
  onUpdated?: (p: Post) => void
  onDeleted?: (id: string) => void
}) {
  const { data } = useSession()
  const meId = data?.user?.id
  const isOwner = meId && meId === post.owner.id

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.counts.likes)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(post.body)
  const [editImages, setEditImages] = useState<{ url: string; width?: number | null; height?: number | null }[]>(
    post.images || []
  )
  const fileRef = useRef<HTMLInputElement | null>(null)
  const maxPreview = 300
  const maxImages = 5

  async function toggleLike() {
    try {
      const res = await fetch(`/api/posts/${post.id}/likes`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) return
      if (data.liked) {
        setLiked(true)
        setLikeCount((c) => c + 1)
      } else {
        setLiked(false)
        setLikeCount((c) => Math.max(0, c - 1))
      }
    } catch {}
  }

  async function loadComments() {
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/comments?limit=50`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setComments(data.items || [])
    } catch {}
    setLoadingComments(false)
  }

  async function sendComment() {
    const body = commentText.trim()
    if (!body) return
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (res.ok) {
        setCommentText('')
        await loadComments()
      }
    } catch {}
  }

  function removeEditImage(idx: number) {
    setEditImages((prev) => prev.filter((_, i) => i !== idx))
  }

  async function addEditImages(files: FileList | null) {
    if (!files || files.length === 0) return
    const roomLeft = Math.max(0, maxImages - editImages.length)
    const arr = Array.from(files).slice(0, roomLeft)
    const uploaded: { url: string; width?: number; height?: number }[] = []
    for (const f of arr) {
      const fd = new FormData()
      fd.set('file', f)
      const res = await fetch('/api/upload?type=post', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok && data?.url) uploaded.push({ url: data.url })
    }
    setEditImages((prev) => [...prev, ...uploaded].slice(0, maxImages))
  }

  async function saveEdit() {
    const body = editText.trim()
    if (!body && editImages.length === 0) return
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, images: editImages }),
      })
      const data = await res.json()
      if (res.ok) {
        setEditing(false)
        onUpdated?.({
          ...post,
          body,
          images: editImages as any,
        })
      } else {
        console.error(data?.error)
      }
    } catch {}
  }

  async function deletePost() {
    if (!confirm('Gönderiyi silmek istediğine emin misin?')) return
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) onDeleted?.(post.id)
      else console.error(data?.error)
    } catch {}
  }

  useEffect(() => {
    if (commentsOpen) loadComments()
  }, [commentsOpen])

  const fullLinked = useMemo(() => linkify(post.body), [post.body])
  const truncated = post.body.length > maxPreview && !expanded

  return (
    <div className="card p-3">
      <div className="flex items-start gap-3">
        <Avatar src={post.owner.avatarUrl || undefined} size={36} alt={post.owner.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={userPath(post.owner.username, post.owner.name)} className="font-medium hover:underline">
              {post.owner.name}
            </Link>
            {post.owner.username && <span className="text-xs text-gray-500">@{post.owner.username}</span>}
            <span className="text-xs text-gray-400">· {timeAgo(post.createdAt)}</span>
            {isOwner && (
              <div className="ml-auto flex items-center gap-2">
                {!editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditText(post.body)
                      setEditImages(post.images || [])
                      setEditing(true)
                    }}
                    className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50"
                  >
                    Düzenle
                  </button>
                )}
                {!editing && (
                  <button
                    type="button"
                    onClick={deletePost}
                    className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50"
                  >
                    Sil
                  </button>
                )}
              </div>
            )}
          </div>

          {!editing ? (
            <>
              <div className="mt-1 text-sm whitespace-pre-wrap break-words">
                {truncated ? (
                  <>
                    {linkify(post.body.slice(0, maxPreview))}…{' '}
                    <button
                      type="button"
                      onClick={() => setExpanded(true)}
                      className="text-rose-600 hover:underline text-xs"
                    >
                      Devamını oku
                    </button>
                  </>
                ) : (
                  fullLinked
                )}
              </div>

              {post.images.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {post.images.map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={img.url} alt="" className="rounded-2xl object-cover w-full h-36" />
                  ))}
                </div>
              )}

              <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                <button type="button" onClick={toggleLike} className="hover:text-rose-600">
                  ❤️ {likeCount}
                </button>
                <button type="button" onClick={() => setCommentsOpen((v) => !v)} className="hover:text-rose-600">
                  💬 {post.counts.comments}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-2 space-y-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full resize-y rounded-2xl border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-rose-200"
              />
              <div>
                {editImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {editImages.map((img, i) => (
                      <div key={i} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="rounded-xl object-cover w-full h-28" />
                        <button
                          type="button"
                          onClick={() => removeEditImage(i)}
                          className="absolute top-1 right-1 rounded-full bg-white/90 border px-2 py-0.5 text-xs hover:bg-white"
                          aria-label="Görseli kaldır"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  className="hidden"
                  onChange={(e) => addEditImages(e.target.files)}
                />
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={editImages.length >= maxImages}
                    className="rounded-full border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-60"
                  >
                    Görsel ekle ({editImages.length}/{maxImages})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  className="rounded-full bg-gray-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-gray-800"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-full border px-3 py-1.5 text-xs hover:bg-gray-50"
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          {commentsOpen && !editing && (
            <div className="mt-3 space-y-2">
              {loadingComments ? (
                <div className="text-xs text-gray-500">Yorumlar yükleniyor…</div>
              ) : comments.length === 0 ? (
                <div className="text-xs text-gray-500">Henüz yorum yok.</div>
              ) : (
                <div className="space-y-2">
                  {comments.map((c) => (
                    <div key={c.id} className="rounded-2xl bg-gray-50 p-2">
                      <div className="text-xs text-gray-500">
                        <Link href={userPath(c.user?.username, c.user?.name)} className="font-medium hover:underline">
                          {c.user?.name || 'Kullanıcı'}
                        </Link>{' '}
                        · {timeAgo(c.createdAt)}
                      </div>
                      <div className="text-sm whitespace-pre-wrap break-words">{c.body}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Yorum yaz…"
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-gray-200 p-2 text-sm outline-none focus:ring-2 focus:ring-rose-200"
                />
                <button
                  type="button"
                  onClick={sendComment}
                  className="self-end rounded-full bg-gray-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-gray-800"
                >
                  Gönder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
