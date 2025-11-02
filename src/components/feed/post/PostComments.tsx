// src/components/feed/post/PostComments.tsx
import { useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

export default function PostComments({
  open, loading, items, text, setText, onSend, canInteract
}: {
  open: boolean
  loading: boolean
  items: any[]
  text: string
  setText: (v: string)=>void
  onSend: ()=>void
  canInteract: boolean
}) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? items : items.slice(0, 3)

  if (!open) return null

  return (
    <div className="mt-3 space-y-2">
      {loading ? (
        <div className="text-xs text-gray-500">Yorumlar yükleniyor…</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-gray-500">Henüz yorum yok.</div>
      ) : (
        <div className="space-y-2">
          {visible.map((c) => (
            <div key={c.id} className="rounded-2xl bg-gray-50 p-2">
              <div className="flex items-start gap-2">
                <Avatar src={c.user?.avatarUrl || undefined} size={28} alt={c.user?.name || 'Kullanıcı'} />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">
                    <Link href={userPath(c.user?.username, c.user?.name, c.user?.slug)} className="font-medium hover:underline">
                      {c.user?.name || 'Kullanıcı'}
                    </Link>{' '}· {new Date(c.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm whitespace-pre-wrap break-words">{c.body}</div>
                </div>
              </div>
            </div>
          ))}
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
