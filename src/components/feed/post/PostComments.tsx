// src/components/feed/post/PostComments.tsx
import { useEffect, useRef, useState } from 'react'
import EmojiPicker from '@/components/EmojiPicker'
import { useSession } from 'next-auth/react'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

export default function PostComments({
  open,
  loading,
  items,
  text,
  setText,
  onSend,
  canInteract,
  reload,
  onToggleLike,
  likingId,
}: {
  open: boolean
  loading: boolean
  items: any[]
  text: string
  setText: (v: string)=>void
  onSend: ()=>void
  canInteract: boolean
  reload?: () => void
  onToggleLike: (commentId: string) => void
  likingId?: string | null
}) {
  const { data } = useSession()
  const meId = (data?.user as any)?.id || null
  const [showAll, setShowAll] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const visible = showAll ? items : items.slice(0, 3)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const emojiBtnRef = useRef<HTMLButtonElement | null>(null)

  if (!open) return null

  return (
    <div className="mt-3 space-y-2">
      {loading ? (
        <div className="text-xs text-gray-500">Yorumlar yükleniyor…</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-gray-500">Henüz yorum yok.</div>
      ) : (
        <div className="space-y-2">
          {visible.map((c) => {
            const isMine = meId && c.user?.id === meId
            const inEdit = editId === c.id
            const likeCount = Number(c.likes || 0)
            const liked = !!c.likedByMe
            const createdAtLabel = new Date(c.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            return (
              <div key={c.id} className="rounded-2xl bg-gray-50 p-2">
                <div className="flex items-start gap-2">
                  <Link href={userPath(c.user?.username, c.user?.name, c.user?.slug)} className="shrink-0">
                    <Avatar src={c.user?.avatarUrl || undefined} size={28} alt={c.user?.name || 'Kullanıcı'} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Link href={userPath(c.user?.username, c.user?.name, c.user?.slug)} className="font-medium hover:underline">
                        {c.user?.name || 'Kullanıcı'}
                      </Link>
                      <span className="text-[11px] text-gray-400">· {createdAtLabel}</span>
                      {isMine && !inEdit && (
                        <span className="ml-auto inline-flex items-center gap-2">
                          <button type="button" onClick={() => { setEditId(c.id); setEditText(c.body || '') }} className="text-gray-600 hover:underline">Düzenle</button>
                          <button type="button" onClick={async () => { await fetch(`/api/comments/${c.id}`, { method: 'DELETE' }); reload?.() }} className="text-red-600 hover:underline">Sil</button>
                        </span>
                      )}
                    </div>
                    {!inEdit && <CommentBody text={c.body || ''} />}
                    {!inEdit && (
                      <div className="mt-1 flex items-center justify-end text-xs text-gray-500">
                        <button
                          type="button"
                          onClick={() => canInteract && onToggleLike(c.id)}
                          disabled={!canInteract || likingId === c.id}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
                            liked ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-transparent text-gray-600 hover:bg-white'
                          } ${(!canInteract || likingId === c.id) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : 'fill-none'}`} />
                          <span>{likeCount}</span>
                        </button>
                      </div>
                    )}
                    {inEdit && (
                      <div className="mt-1 flex items-center gap-2">
                        <textarea value={editText} onChange={(e)=>setEditText(e.target.value)} rows={2} className="flex-1 rounded-xl border px-3 py-2 text-sm" />
                        <button type="button" onClick={async () => { await fetch(`/api/comments/${c.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body: editText }) }); setEditId(null); reload?.() }} className="rounded-full bg-gray-900 text-white px-3 py-1 text-xs">Kaydet</button>
                        <button type="button" onClick={()=>{ setEditId(null); setEditText('') }} className="rounded-full border px-3 py-1 text-xs">Vazgeç</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {items.length > 3 && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-xs text-rose-600 hover:underline"
            >
              Daha fazla yorum göster ({items.length - 3})
            </button>
          )}
        </div>
      )}

      <div className="flex items-start gap-2">
        <textarea
          value={text}
          onChange={(e)=>setText(e.target.value)}
          placeholder={canInteract ? 'Yorumun…' : 'Tüm özelliklerden faydalanmak için e‑postanızı doğrulayın'}
          rows={2}
          disabled={!canInteract}
          className="flex-1 resize-none rounded-xl border border-gray-200 p-2 text-sm outline-none focus:ring-2 focus:ring-rose-200 disabled:bg-gray-50 disabled:opacity-60"
        />
        <div className="relative self-end">
          <button
            ref={emojiBtnRef}
            type="button"
            onClick={() => canInteract && setEmojiOpen(v=>!v)}
            disabled={!canInteract}
            className="text-xl leading-none text-gray-500 hover:text-gray-700 disabled:text-gray-300"
            aria-label="Emoji ekle"
          >
            🙂
          </button>
          <EmojiPicker open={emojiOpen} onClose={() => setEmojiOpen(false)} onPick={(e)=>{ setText((text || '') + e); setEmojiOpen(false) }} anchorRef={emojiBtnRef} />
        </div>
        <button
          type="button"
          onClick={canInteract ? onSend : undefined}
          disabled={!canInteract || !text.trim()}
          className="self-end rounded-full bg-gray-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Gönder
        </button>
      </div>
    </div>
  )
}

function CommentBody({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const limit = 100
  const needsClamp = text.length > limit
  const preview = text.slice(0, limit).trimEnd()
  const display = expanded || !needsClamp ? text : `${preview}${preview.endsWith('…') ? '' : '…'}`

  return (
    <div className="text-sm whitespace-pre-wrap break-words">
      {display}
      {!expanded && needsClamp && (
        <>
          {' '}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-rose-600 hover:underline text-xs font-medium"
          >
            Devamını oku
          </button>
        </>
      )}
    </div>
  )
}
