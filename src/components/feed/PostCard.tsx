// src/components/feed/PostCard.tsx
'use client'

import LikeButton from './LikeButton'
import CommentList from './CommentList'

type Post = {
  id: string
  body: string
  createdAt: string
  owner: { id: string; name: string | null; username: string | null; avatarUrl: string | null }
  images: { url: string; width?: number | null; height?: number | null }[]
  _count: { likes: number; comments: number }
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <img
          src={post.owner.avatarUrl || `https://api.dicebear.com/8.x/thumbs/png?seed=${encodeURIComponent(post.owner.id)}`}
          alt=""
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <div className="font-medium">{post.owner.name}</div>
          <div className="text-xs text-gray-500">@{post.owner.username}</div>
        </div>
        <div className="ml-auto text-xs text-gray-500">
          {new Date(post.createdAt).toLocaleString('tr-TR')}
        </div>
      </div>

      <div className="whitespace-pre-wrap">{post.body}</div>

      {!!post.images?.length && (
        <div className="grid grid-cols-2 gap-2">
          {post.images.map((im, i) => (
            <img key={i} src={im.url} alt="" className="w-full rounded-lg border object-cover" />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm">
        <LikeButton postId={post.id} initialCount={post._count.likes} />
        <div className="text-gray-600">💬 {post._count.comments}</div>
      </div>

      <CommentList postId={post.id} />
    </div>
  )
}
