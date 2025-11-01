// src/components/ChatPanel.tsx
'use client'

import useSWR from 'swr'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'
import clsx from 'clsx'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const EMOJIS = [
  '🙂','😀','😁','😂','😅','😉','😊','😍',
  '🤩','😜','😎','😇','🤗','🥳','🙌','🙏',
  '👏','👍','👌','🔥','✨','🎉','❤️','💛',
  '💚','💙','💜','🖤','🤍','📚','✍️','📖'
]

type ChatAuthor = {
  id?: string
  name?: string | null
  username?: string | null
  slug?: string | null
  avatarUrl?: string | null
}

type ChatItem = {
  id: string
  body: string
  isSecret?: boolean
  secretMasked?: boolean
  author?: ChatAuthor | null
}

export default function ChatPanel({
  eventId,
  enabled,
  className,
  allowSecret = false,
  canSeeSecret = false,
  onCountChange,
}: {
  eventId: string | null
  enabled: boolean
  className?: string
  allowSecret?: boolean
  canSeeSecret?: boolean
  onCountChange?: (count: number) => void
}) {
  const canLoad = !!eventId
  const { data, mutate } = useSWR(canLoad ? `/api/chat/events/${eventId}/messages` : null, fetcher, {
    refreshInterval: enabled ? 5000 : 15000,
  })
  const [text, setText] = useState('')
  const [isSecret, setIsSecret] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const emojiBtnRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    const el = scrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }

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

  useEffect(() => {
    if (!allowSecret) setIsSecret(false)
  }, [allowSecret])

  const items: ChatItem[] = Array.isArray(data?.items) ? (data.items as ChatItem[]) : []

  useEffect(() => {
    scrollToBottom()
    onCountChange?.(items.length)
  }, [enabled, items.length, onCountChange])

  const send = async () => {
    if (!enabled || !eventId) return
    const body = text.trim()
    if (!body) return
    setText('')
    const payload: Record<string, unknown> = { body }
    if (allowSecret) payload.isSecret = isSecret
    scrollToBottom()
    const res = await fetch(`/api/chat/events/${eventId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      mutate()
      setIsSecret(false)
    }
  }

  return (
    <div className={clsx('flex flex-col gap-2 pt-2 text-slate-700 max-h-[440px]', className)}>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto px-1 pb-2">
        {items.length === 0 && (
          <div className="p-2 text-sm text-slate-500">Henüz mesaj yok.</div>
        )}
        {items.map((m) => {
          const masked = !!m.isSecret && (!canSeeSecret || m.secretMasked)
          return (
            <div key={m.id} className="flex gap-2 items-start p-2">
              <Link href={userPath(m.author?.username, m.author?.name, m.author?.slug)} className="inline-block">
                <Avatar src={m.author?.avatarUrl ?? null} size={32} alt={m.author?.name ?? 'Üye'} />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-slate-800">{m.author?.name ?? 'Üye'}</div>
                  {m.isSecret && (
                    <span className="inline-flex items-center rounded-full bg-[#fa3d30]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#fa3d30]">
                      Gizli
                    </span>
                  )}
                </div>
                <div
                  className={clsx(
                    'mt-1 whitespace-pre-wrap text-sm',
                    masked ? 'italic text-slate-400' : 'text-slate-600',
                  )}
                >
                  {m.body}
                </div>
                {m.isSecret && (
                  <div className="mt-1 text-xs text-slate-400">
                    {masked ? 'Mesajı görmek için etkinliğe üye olmalısınız.' : 'Bu mesaj yalnızca etkinlik katılımcılarına görünür.'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="relative flex gap-2 items-center">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => enabled && e.key === 'Enter' && send()}
          className="flex-1 h-11 rounded-xl border pl-4 pr-3 disabled:opacity-60"
          placeholder={enabled && eventId ? 'Mesajınızı yazın' : 'Sohbete katılmak için etkinliğe dahil olun'}
          disabled={!enabled || !eventId}
        />
        <div className="relative">
          <button
            ref={emojiBtnRef}
            type="button"
            onClick={() => enabled && setEmojiOpen((v) => !v)}
            
            aria-label="Emoji seç"
            disabled={!enabled}
            className="text-2xl leading-none text-slate-500 transition hover:text-slate-700 disabled:text-slate-300"
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
          disabled={!enabled || !eventId}
        >
          Gönder
        </button>
      </div>
      {allowSecret && (
        <label className="flex items-center gap-2 pl-1 text-xs text-slate-500">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-[#fa3d30] focus:ring-[#fa3d30]"
            checked={isSecret}
            onChange={(e) => setIsSecret(e.target.checked)}
          />
          <span>Gizli mesaj • Yalnızca etkinlik katılımcıları görür</span>
        </label>
      )}
    </div>
  )
}
