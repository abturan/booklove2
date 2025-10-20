// src/components/feed/post/PostHeader.tsx
import Avatar from '@/components/Avatar'
import Link from 'next/link'
import { userPath } from '@/lib/userPath'
import { timeAgo } from './utils/timeAgo'
import type { Post } from './types'
export default function PostHeader({ post, isOwner, editing, onEdit, onDelete }: { post: Post; isOwner: boolean; editing: boolean; onEdit: () => void; onDelete: () => void }) {
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
          {isOwner && !editing && (
            <div className="ml-auto flex items-center gap-2">
              <button type="button" onClick={onEdit} className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50">Düzenle</button>
              <button type="button" onClick={onDelete} className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50">Sil</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
