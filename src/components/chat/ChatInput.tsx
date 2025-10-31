// src/components/chat/ChatInput.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import EmojiPicker from './EmojiPicker'

export default function ChatInput({
  eventId,
  enabled,
  onSent,
}: {
  eventId: string
  enabled: boolean
  onSent: () => void
}) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return
      const t = e.target as Node
      if (btnRef.current?.contains(t)) return
      setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const send = async () => {
    if (!enabled) return
    const body = text.trim()
    if (!body) return
    setText('')
    const res = await fetch(`/api/chat/events/${eventId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    if (res.ok) onSent()
  }

  return (
    <div className="rounded-2xl border bg-white p-2 overflow-hidden min-w-0">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center min-w-0">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => enabled && e.key === 'Enter' && send()}
          className="h-11 px-3 rounded-xl border bg-white disabled:opacity-60 min-w-0"
          placeholder="🙂 gibi emojiler kullanabilirsiniz…"
          disabled={!enabled}
        />
        <div className="relative">
          <button
            ref={btnRef}
            type="button"
            onClick={() => enabled && setOpen((v) => !v)}
            className="h-11 px-3 rounded-xl border bg-white disabled:opacity-60 shrink-0"
            aria-label="Emoji seç"
            disabled={!enabled}
          >
            🙂
          </button>
          {open && (
            <div className="absolute bottom-12 right-0 z-10">
              <EmojiPicker
                onSelect={(e) => {
                  setText((t) => t + e)
                  setOpen(false)
                  inputRef.current?.focus()
                }}
              />
            </div>
          )}
        </div>
        <button
          onClick={send}
          className="h-11 px-4 rounded-xl bg-gray-900 text-white disabled:opacity-60 shrink-0"
          disabled={!enabled}
        >
          Gönder
        </button>
      </div>
    </div>
  )
}
