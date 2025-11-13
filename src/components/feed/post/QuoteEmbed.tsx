// src/components/feed/post/QuoteEmbed.tsx
'use client'

import Avatar from '@/components/Avatar'
import { useState, useEffect } from 'react'
import PostBody from './PostBody'
import PostImages from './PostImages'
import Modal from '@/components/ui/modal'
import LikeButton from '@/components/feed/LikeButton'
import LikeListModal from './LikeListModal'
import CommentList from '@/components/feed/CommentList'
import type { Post } from './types'
import { timeAgo } from './utils/timeAgo'

type MinimalPost = Pick<Post, 'id' | 'body' | 'createdAt' | 'images' | 'owner'> & { repostOf?: any | null }

export default function QuoteEmbed({ quoted, depth = 0 }: { quoted: MinimalPost; depth?: number }) {
  const [open, setOpen] = useState(false)
  const [full, setFull] = useState<Post | null>(null)
  const [likersOpen, setLikersOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    let alive = true
    async function load() {
      try {
        const r = await fetch(`/api/posts/${quoted.id}`, { cache: 'no-store' })
        const j = await r.json()
        if (!alive) return
        if (r.ok && j?.id) setFull(j)
      } catch {}
    }
    load()
    return () => { alive = false }
  }, [open, quoted.id])

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true) } }}
        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
      >
          <div className="mb-2 flex items-center gap-2">
            <Avatar src={quoted.owner.avatarUrl || undefined} size={24} alt={quoted.owner.name} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{quoted.owner.name}</div>
              <div className="text-[11px] text-gray-500">{quoted.owner.username ? `@${quoted.owner.username} · ` : ''}{timeAgo(quoted.createdAt)}</div>
            </div>
          </div>
          <PostBody text={quoted.body} />
          <PostImages images={quoted.images} enableLightbox={false} />

          {depth < 1 && quoted.repostOf && (
            <div className="mt-2">
              <QuoteEmbed quoted={quoted.repostOf as any} depth={depth + 1} />
            </div>
          )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        {!full && <div className="p-4 text-sm text-gray-600">Yükleniyor…</div>}
        {full && (
          <div className="p-2 space-y-4">
            {/* Basit görünüm: gövde + görseller + varsa tek seviye alıntı */}
            <div className="mb-2 flex items-center gap-2">
              <Avatar src={full.owner.avatarUrl || undefined} size={36} alt={full.owner.name} />
              <div className="min-w-0">
                <div className="truncate font-medium">{full.owner.name}</div>
                <div className="text-xs text-gray-500">{full.owner.username ? `@${full.owner.username} · ` : ''}{timeAgo(full.createdAt)}</div>
              </div>
            </div>
            <PostBody text={full.body} />
            <PostImages images={full.images} />
            {full.repostOf && (
              <div className="mt-2">
                <QuoteEmbed quoted={full.repostOf as any} depth={1} />
              </div>
            )}

            <div className="flex items-center gap-2">
              <LikeButton postId={full.id} initialCount={Number((full as any)?.counts?.likes || 0)} />
              <button
                type="button"
                onClick={() => setLikersOpen(true)}
                className="px-3 py-1.5 rounded-full border text-sm"
              >
                Beğenenleri gör
              </button>
            </div>

            <div className="pt-2">
              <CommentList postId={full.id} />
            </div>
          </div>
        )}
        {full && (
          <Modal open={likersOpen} onClose={() => setLikersOpen(false)} title="Beğenenler">
            <LikeListModal postId={full.id} />
          </Modal>
        )}
      </Modal>
    </>
  )
}
