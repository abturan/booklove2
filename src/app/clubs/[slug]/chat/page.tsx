'use client'
import { useEffect, useRef, useState } from 'react'

async function fetchClub(slug: string) {
  const res = await fetch('/api/clubs?take=100&q=' + encodeURIComponent(slug), { cache: 'no-store' })
  const j = await res.json()
  return j.items.find((x:any)=>x.slug===slug)
}

export default function ChatPage({ params }: { params: { slug: string } }) {
  const [club, setClub] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [text, setText] = useState('')
  const [quoted, setQuoted] = useState<any>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/presence/ping', { method: 'POST' }) // best-effort heartbeat
    ;(async () => {
      const c = await fetchClub(params.slug)
      setClub(c)
      if (c) {
        const r = await fetch(`/api/chat/${c.id}/messages`, { cache: 'no-store' })
        const jj = await r.json()
        setItems(jj.items)
      }
    })()
  }, [params.slug])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [items])

  async function send() {
    if (!text || !club) return
    const res = await fetch(`/api/chat/${club.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text, quotedId: quoted?.id })
    })
    if (res.ok) {
      const r = await fetch(`/api/chat/${club.id}/messages`, { cache: 'no-store' })
      const jj = await r.json()
      setItems(jj.items)
      setText('')
      setQuoted(null)
    } else {
      alert('Mesaj gönderilemedi (abonelik gerekli olabilir).')
    }
  }

  return (
    <div className="max-w-3xl mx-auto h-[70vh] card p-4 flex flex-col">
      <div className="font-medium mb-2">Kulüp Sohbeti</div>
      <div ref={listRef} className="flex-1 overflow-y-auto space-y-2">
        {items.map(m => (
          <div key={m.id} className="px-3 py-2 rounded-2xl bg-white/70">
            <div className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleTimeString('tr-TR')} • {m.authorName}</div>
            {m.quotedId && <div className="text-xs text-gray-500 border-l-2 pl-2 my-1">Alıntı • {m.quotedId}</div>}
            <div className="whitespace-pre-wrap">{m.body}</div>
            <div className="mt-1">
              <button onClick={()=>setQuoted(m)} className="text-xs text-gray-600 underline">Alıntıla</button>
            </div>
          </div>
        ))}
      </div>
      {quoted && (
        <div className="mb-2 text-xs text-gray-600 border-l-2 pl-2">Yanıtlanacak: {quoted.body.slice(0,80)}</div>
      )}
      <div className="flex gap-2 mt-1">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="@kullanıcı mention yazabilir, alıntı destekli"
          className="flex-1 rounded-2xl border px-4 py-3" />
        <button onClick={send} className="rounded-2xl bg-gray-900 text-white px-4">Gönder</button>
      </div>
    </div>
  )
}
