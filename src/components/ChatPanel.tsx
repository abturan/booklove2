'use client'

import useSWR from 'swr'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ChatPanel({
  clubId,
  enabled,
}: {
  clubId: string
  enabled: boolean
}) {
  const { data, mutate } = useSWR(
    enabled ? `/api/chat/${clubId}/messages` : null,
    fetcher,
    { refreshInterval: enabled ? 5000 : 0 }
  )
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data])

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-600">
        Yalnızca aboneler sohbeti görebilir ve mesaj yazabilir.
      </div>
    )
  }

  const items: any[] = data?.items ?? []

  const send = async () => {
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
      <div className="max-h-[360px] overflow-auto rounded-2xl bg-white p-3 border">
        {items.length === 0 && (
          <div className="text-sm text-gray-600 p-2">Henüz mesaj yok.</div>
        )}
        {items.map((m) => (
          <div key={m.id} className="flex gap-2 items-start p-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100">
              <Image
                src={
                  m.author.avatarUrl ||
                  `https://api.dicebear.com/8.x/thumbs/png?seed=${encodeURIComponent(m.author.id)}`
                }
                alt={m.author.name ?? 'Üye'}
                fill
              />
            </div>
            <div>
              <div className="text-sm font-medium">{m.author.name ?? 'Üye'}</div>
              <div className="text-sm">{m.body}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          className="flex-1 h-11 px-3 rounded-xl border"
          placeholder=" 🙂 gibi emojiler kullanabilirsin…"
        />
        <button
          onClick={send}
          className="h-11 px-4 rounded-xl bg-gray-900 text-white"
        >
          Gönder
        </button>
      </div>
    </div>
  )
}
