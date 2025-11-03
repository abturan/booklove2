// src/components/feed/post/PostHeader.tsx
import Avatar from '@/components/Avatar'
import Link from 'next/link'
import { userPath } from '@/lib/userPath'
import { timeAgo } from './utils/timeAgo'
import type { Post } from './types'
import { useState } from 'react'

export default function PostHeader({
  post,
}: {
  post: Post
  isOwner: boolean
  isAdmin: boolean
  editing: boolean
  onEdit: () => void
  onDelete: () => void
  onModerated?: (status: Post['status']) => void
}) {
  const [_busy, _setBusy] = useState<null>(null)

  return (
    <div className="flex items-start gap-3">
      <Avatar src={post.owner.avatarUrl || undefined} size={36} alt={post.owner.name} />
      <div className="min-w-0 flex-1">
        <div>
          <Link
            href={userPath(post.owner.username, post.owner.name, post.owner.slug)}
            className="font-medium hover:underline leading-snug truncate block"
          >
            {post.owner.name}
          </Link>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          {post.owner.username && <span className="text-xs text-gray-500">@{post.owner.username}</span>}
          <span className="text-xs text-gray-400">· {timeAgo(post.createdAt)}</span>
          {/* Rebookie rozeti istemiyoruz; aksiyon çubuğunda ikon var */}
        </div>
      </div>
    </div>
  )
}
