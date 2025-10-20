// src/components/feed/post/types.ts
export type Post = {
  id: string
  body: string
  createdAt: string
  status?: 'PUBLISHED' | 'PENDING' | 'HIDDEN'
  owner: { id: string; name: string; username: string | null; slug: string | null; avatarUrl: string | null }
  images: { url: string; width: number | null; height: number | null }[]
  counts?: { likes?: number; comments?: number }
}
