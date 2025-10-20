// src/components/feed/post/PostModeration.tsx
'use client'

export default function PostModeration({
  postId,
  status,
  onChanged,
}: {
  postId: string
  status?: 'PUBLISHED' | 'PENDING' | 'HIDDEN'
  onChanged?: (next: 'PUBLISHED' | 'PENDING' | 'HIDDEN') => void
}) {
  async function act(action: 'publish' | 'pending' | 'hide') {
    const res = await fetch(`/api/posts/${postId}/moderate`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      const j = await res.json().catch(() => null)
      const next = j?.post?.status as 'PUBLISHED' | 'PENDING' | 'HIDDEN'
      if (next) onChanged?.(next)
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      <span className="px-2 py-0.5 rounded-full border bg-white">{status || '—'}</span>
      <button type="button" onClick={() => act('publish')} className="rounded-full border px-2 py-0.5 hover:bg-gray-50">
        Yayınla
      </button>
      <button type="button" onClick={() => act('pending')} className="rounded-full border px-2 py-0.5 hover:bg-gray-50">
        Beklet
      </button>
      <button type="button" onClick={() => act('hide')} className="rounded-full border px-2 py-0.5 hover:bg-gray-50">
        Gizle
      </button>
    </div>
  )
}
