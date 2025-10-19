// //src/components/profile/ProfileFeed.tsx
// 'use client'

// import { useEffect, useRef, useState } from 'react'
// import PostComposer from '@/components/feed/PostComposer'
// import PostCard, { type Post } from '@/components/feed/PostCard'

// export default function ProfileFeed({ ownerId }: { ownerId: string }) {
//   const [items, setItems] = useState<Post[]>([])
//   const [cursor, setCursor] = useState<string | null>(null)
//   const [hasMore, setHasMore] = useState(true)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const sentinelRef = useRef<HTMLDivElement | null>(null)

//   useEffect(() => {
//     resetAndLoad()
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [ownerId])

//   async function resetAndLoad() {
//     setItems([])
//     setCursor(null)
//     setHasMore(true)
//     await loadMore(true)
//   }

//   async function loadMore(isFirst = false) {
//     if (loading || !hasMore) return
//     setLoading(true)
//     setError(null)
//     try {
//       const q = new URLSearchParams()
//       q.set('scope', 'user')
//       q.set('ownerId', ownerId)
//       q.set('limit', '10')
//       if (!isFirst && cursor) q.set('cursor', cursor)
//       const res = await fetch(`/api/posts?${q.toString()}`, { cache: 'no-store' })
//       const data = await res.json()
//       if (!res.ok) throw new Error(data?.error || 'Akış yüklenemedi')
//       const nextCursor = data?.nextCursor || null
//       const newItems: Post[] = (data?.items || []).map((p: any) => normalizePost(p))
//       setItems((prev) => {
//         const seen = new Set(prev.map((x) => x.id))
//         const merged = [...prev]
//         for (const it of newItems) if (!seen.has(it.id)) merged.push(it)
//         return merged
//       })
//       setCursor(nextCursor)
//       setHasMore(!!nextCursor)
//     } catch (e: any) {
//       // profil akışında hata mesajı göstermeyelim, sadece durdur
//       setHasMore(false)
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     const el = sentinelRef.current
//     if (!el) return
//     const io = new IntersectionObserver(
//       (entries) => {
//         const first = entries[0]
//         if (first.isIntersecting) loadMore(false)
//       },
//       { rootMargin: '400px 0px' }
//     )
//     io.observe(el)
//     return () => io.disconnect()
//   }, [sentinelRef.current, cursor, hasMore, loading]) // eslint-disable-line react-hooks/exhaustive-deps

//   return (
//     <div className="space-y-3">
//       {/* Profil akışında composer göstermiyoruz; sadece bu kullanıcının gönderileri */}
//       {items.map((p) => (
//         <PostCard key={p.id} post={p} />
//       ))}
//       <div ref={sentinelRef} />
//       <div className="flex justify-center py-3">
//         {loading && <span className="text-xs text-gray-600">Yükleniyor…</span>}
//         {!hasMore && items.length > 0 && <span className="text-xs text-gray-500">Bitti</span>}
//       </div>
//     </div>
//   )
// }

// function normalizePost(p: any): Post {
//   return {
//     id: String(p.id),
//     body: String(p.body || ''),
//     createdAt: String(p.createdAt || new Date().toISOString()),
//     owner: {
//       id: p.owner?.id || '',
//       name: p.owner?.name || 'Kullanıcı',
//       username: p.owner?.username || null,
//       avatarUrl: p.owner?.avatarUrl || null,
//     },
//     images: Array.isArray(p.images)
//       ? p.images.map((i: any) => ({
//           url: String(i.url || ''),
//           width: typeof i.width === 'number' ? i.width : null,
//           height: typeof i.height === 'number' ? i.height : null,
//         }))
//       : [],
//     counts: { likes: Number(p._count?.likes || 0), comments: Number(p._count?.comments || 0) },
//   }
// }
