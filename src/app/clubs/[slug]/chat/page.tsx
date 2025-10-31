'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type ChatItem = {
  id: string
  body: string
  createdAt: string
  authorName: string
  quotedId?: string | null
}

type ClubLite = {
  id: string
  name: string
  slug: string
}

type EventLite = {
  id: string
  title: string
  startsAt: string
  status: 'upcoming' | 'past'
}

async function fetchClub(slug: string): Promise<ClubLite | null> {
  const res = await fetch(`/api/clubs?take=1&q=${encodeURIComponent(slug)}`, { cache: 'no-store' })
  const data = await res.json().catch(() => ({ items: [] }))
  const item = Array.isArray(data.items) ? data.items.find((x: any) => x.slug === slug) : null
  if (!item) return null
  return { id: item.id, name: item.name, slug: item.slug }
}

async function fetchEvents(slug: string): Promise<EventLite[]> {
  const res = await fetch(`/api/clubs/by-slug/${encodeURIComponent(slug)}/events`, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({ events: [] }))
  return Array.isArray(data.events) ? data.events : []
}

async function fetchMessages(eventId: string): Promise<ChatItem[]> {
  const res = await fetch(`/api/chat/events/${eventId}/messages`, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({ items: [] }))
  return Array.isArray(data.items) ? data.items : []
}

export default function ChatPage({ params }: { params: { slug: string } }) {
  const [club, setClub] = useState<ClubLite | null>(null)
  const [events, setEvents] = useState<EventLite[]>([])
  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  const [items, setItems] = useState<ChatItem[]>([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/presence/ping', { method: 'POST' }).catch(() => {}) // best-effort heartbeat
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const [clubData, eventData] = await Promise.all([fetchClub(params.slug), fetchEvents(params.slug)])
      if (cancelled) return
      setClub(clubData)
      setEvents(eventData)
      const preferred =
        eventData.find((e) => e.status === 'upcoming')?.id ?? eventData[eventData.length - 1]?.id ?? null
      setActiveEventId(preferred)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [params.slug])

  useEffect(() => {
    let cancelled = false
    if (!activeEventId) {
      setItems([])
      return
    }
    ;(async () => {
      const msgs = await fetchMessages(activeEventId)
      if (!cancelled) setItems(msgs)
    })()
    return () => {
      cancelled = true
    }
  }, [activeEventId])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [items])

  const activeEvent = useMemo(() => events.find((e) => e.id === activeEventId) ?? null, [events, activeEventId])

  const send = async () => {
    if (!activeEventId || !text.trim()) return
    const body = text.trim()
    setText('')
    const res = await fetch(`/api/chat/events/${activeEventId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    if (res.ok) {
      const msgs = await fetchMessages(activeEventId)
      setItems(msgs)
    } else {
      alert('Mesaj gönderilemedi. Abonelik gerekli olabilir.')
    }
  }

  const title = club ? `${club.name} • Sohbet` : 'Sohbet'

  return (
    <div className="max-w-3xl mx-auto h-[70vh] card p-4 flex flex-col gap-4">
      <div>
        <div className="text-lg font-semibold">{title}</div>
        {events.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-600">Etkinlik:</span>
            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={activeEventId ?? ''}
              onChange={(e) => setActiveEventId(e.target.value || null)}
            >
              <option value="">Seçiniz</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {new Date(e.startsAt).toLocaleDateString('tr-TR')} · {e.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-1 grid place-items-center text-sm text-gray-600">Yükleniyor…</div>
      ) : !activeEventId ? (
        <div className="flex-1 grid place-items-center text-sm text-gray-600">
          Bu kulüpte sohbet için etkinlik seçin.
        </div>
      ) : (
        <>
          {activeEvent && (
            <div className="text-xs text-gray-500">
              {new Date(activeEvent.startsAt).toLocaleDateString('tr-TR', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}{' '}
              • {activeEvent.status === 'upcoming' ? 'Yaklaşan etkinlik' : 'Geçmiş etkinlik'}
            </div>
          )}

          <div ref={listRef} className="flex-1 overflow-y-auto space-y-2">
            {items.map((m) => (
              <div key={m.id} className="px-3 py-2 rounded-2xl bg-white/80 border border-gray-100">
                <div className="text-xs text-gray-500">
                  {new Date(m.createdAt).toLocaleTimeString('tr-TR')} • {m.authorName}
                </div>
                {m.quotedId && (
                  <div className="mt-1 text-xs text-gray-500 border-l-2 border-gray-200 pl-2">
                    Alıntı • {m.quotedId}
                  </div>
                )}
                <div className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{m.body}</div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-sm text-gray-600 py-6 text-center">Henüz mesaj yok.</div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Mesaj yazın…"
              className="flex-1 rounded-2xl border px-4 py-3"
            />
            <button onClick={send} className="rounded-2xl bg-gray-900 text-white px-4">
              Gönder
            </button>
          </div>
        </>
      )}
    </div>
  )
}
