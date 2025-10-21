// src/components/chat/ChatList.tsx
'use client'

import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'
import { forwardRef, useEffect } from 'react'

type Msg = { id: string; body: string; author?: { name?: string | null; username?: string | null; slug?: string | null; avatarUrl?: string | null } }
type Props = { items: Msg[]; enabled: boolean }

const ChatList = forwardRef<HTMLDivElement, Props>(({ items, enabled }, ref) => {
  useEffect(() => {
    const el = (ref as any)?.current as HTMLDivElement | null
    if (!el) return
    const diff = el.scrollHeight - el.scrollTop - el.clientHeight
    if (diff < 48) el.scrollTop = el.scrollHeight
  }, [items.length, enabled, ref])

  return (
    <div ref={ref} className="max-h-[360px] overflow-auto rounded-2xl bg-white p-3 border min-w-0">
      {items.length === 0 && <div className="text-sm text-gray-600 p-2">Henüz mesaj yok.</div>}
      {items.map((m) => (
        <div key={m.id} className="flex gap-2 items-start p-2">
          <Link href={userPath(m.author?.username ?? null, m.author?.name ?? 'Üye', m.author?.slug ?? null)} className="inline-block">
            <Avatar src={m.author?.avatarUrl ?? null} size={32} alt={m.author?.name ?? 'Üye'} />
          </Link>
          <div className="min-w-0">
            <div className="text-sm font-medium">{m.author?.name ?? 'Üye'}</div>
            <div className="text-sm break-words">{m.body}</div>
          </div>
        </div>
      ))}
    </div>
  )
})
ChatList.displayName = 'ChatList'
export default ChatList
