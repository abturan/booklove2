// src/components/ChatPanel.tsx
'use client'

import useSWR from 'swr'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const EMOJIS = [
  '🙂','😀','😁','😂','😅','😉','😊','😍',
  '🤩','😜','😎','😇','🤗','🥳','🙌','🙏',
  '👏','👍','👌','🔥','✨','🎉','❤️','💛',
  '💚','💙','💜','🖤','🤍','📚','✍️','📖'
]

export default function ChatPanel({
  clubId,
  enabled,
}: {
  clubId: string
  enabled: boolean
}) {
  const { data, mutate } = useSWR(`/api/chat/${clubId}/messages`, fetcher, {
    refreshInterval: enabled ? 5000 : 15000,
  })
  const [text, setText] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const emojiBtnRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const diff = el.scrollHeight - el.scrollTop - el.clientHeight
    const nearBottom = diff < 48
    if (nearBottom) {
      el.scrollTop = el.scrollHeight
    }
  }, [enabled, data?.items?.length])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node
      if (!emojiOpen) return
      if (emojiRef.current?.contains(t)) return
      if (emojiBtnRef.current?.contains(t)) return
      setEmojiOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setEmojiOpen(false)
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [emojiOpen])

  const items: any[] = data?.items ?? []

  const send = async () => {
    if (!enabled) return
    const body = text.trim()
    if (!body) return
    setText('')
    const res = await fetch(`/api/chat/${clubId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    if (res.ok) mutate()
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={scrollRef} className="max-h-[360px] overflow-auto rounded-2xl bg-white p-3 border">
        {items.length === 0 && (
          <div className="text-sm text-gray-600 p-2">Henüz mesaj yok.</div>
        )}
        {items.map((m) => (
          <div key={m.id} className="flex gap-2 items-start p-2">
            <Link href={userPath(m.author?.username, m.author?.name, m.author?.slug)} className="inline-block">
              <Avatar src={m.author?.avatarUrl ?? null} size={32} alt={m.author?.name ?? 'Üye'} />
            </Link>
            <div>
              <div className="text-sm font-medium">{m.author?.name ?? 'Üye'}</div>
              <div className="text-sm">{m.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative flex gap-2 items-center">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => enabled && e.key === 'Enter' && send()}
          className="flex-1 h-11 px-3 rounded-xl border disabled:opacity-60"
          placeholder="🙂 gibi emojiler kullanabilirsiniz…"
          disabled={!enabled}
        />
        <div className="relative">
          <button
            ref={emojiBtnRef}
            type="button"
            onClick={() => enabled && setEmojiOpen((v) => !v)}
            className="h-11 px-3 rounded-xl border bg-white disabled:opacity-60"
            aria-label="Emoji seç"
            disabled={!enabled}
          >
            🙂
          </button>
          {emojiOpen && (
            <div
              ref={emojiRef}
              className="absolute bottom-12 right-0 z-10 w-56 rounded-2xl border bg-white p-2 shadow-soft"
            >
              <div className="grid grid-cols-8 gap-1">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className="h-8 w-8 grid place-items-center rounded-md hover:bg-gray-100 text-xl"
                    onClick={() => {
                      setText((t) => t + e)
                      setEmojiOpen(false)
                      inputRef.current?.focus()
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={send}
          className="h-11 px-4 rounded-xl bg-gray-900 text-white disabled:opacity-60"
          disabled={!enabled}
        >
          Gönder
        </button>
      </div>
    </div>
  )
}






