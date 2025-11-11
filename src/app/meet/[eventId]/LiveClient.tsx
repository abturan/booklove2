// src/app/meet/[eventId]/LiveClient.tsx
'use client'

import React from 'react'
import LiveRoom from '@/components/meet/LiveRoom'
import { useCallback } from 'react'

type RoomAccess = {
  domain: string
  scriptUrl: string
  roomName: string
  roomSlug: string
  jwt: string
  displayName?: string
  email?: string | null
  avatarUrl?: string | null
  subject?: string | null
  isModerator: boolean
}

type LiveClientProps = {
  eventId: string
  isModerator: boolean
}

export default function LiveClient({ eventId, isModerator }: LiveClientProps) {
  const [access, setAccess] = React.useState<RoomAccess | null>(null)
  const [message, setMessage] = React.useState<string>('')
  const [busy, setBusy] = React.useState<boolean>(false)

  const fetchAccess = React.useCallback(async () => {
    try {
      setBusy(true)
      await fetch('/api/meet/presence/enter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ eventId }),
      }).catch(() => {})

      const res = await fetch('/api/meet/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      const json = await res.json().catch(() => ({}))

      if (res.status === 409 && isModerator) {
        await fetch('/api/meet/activate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ eventId }),
        }).catch(() => {})
        const retry = await fetch('/api/meet/token', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ eventId }),
        })
        const retryJson = await retry.json().catch(() => ({}))
        if (retry.ok && retryJson?.jwt) {
          setAccess(retryJson as RoomAccess)
          setMessage('')
          return
        }
      }

      if (!res.ok || !json?.jwt) {
        const reason =
          json?.error ||
          (res.status === 409
            ? 'Oda kilitli. Moderatör açtığında katılabilirsiniz.'
            : res.status === 425
              ? 'Oturum henüz açılmadı. Planlanan saati bekleyin.'
              : 'Konferans hazırlanamadı.')
        setAccess(null)
        setMessage(reason)
        return
      }

      setAccess(json as RoomAccess)
      setMessage('')
    } finally {
      setBusy(false)
    }
  }, [eventId, isModerator])

  React.useEffect(() => {
    fetchAccess()
  }, [fetchAccess])

  const handleLeave = useCallback(async () => {
    try {
      await fetch('/api/meet/presence/leave', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
    } catch {}
  }, [eventId])

  if (access) {
    return (
      <LiveRoom
        domain={access.domain}
        roomName={access.roomName}
        scriptUrl={access.scriptUrl}
        jwt={access.jwt}
        displayName={access.displayName}
        email={access.email}
        avatarUrl={access.avatarUrl}
        subject={access.subject}
        eventId={eventId}
        onLeave={handleLeave}
        isModerator={access.isModerator}
      />
    )
  }

  return (
    <div className="grid h-full w-full place-items-center bg-black">
      <StatusCard busy={busy} message={message} onRetry={() => fetchAccess()} />
    </div>
  )
}

function StatusCard({ busy, message, onRetry }: { busy: boolean; message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-700">
      <div className="mb-2 text-sm">Bağlantı hazırlanıyor…</div>
      {message && <div className="text-sm text-amber-700">{message}</div>}
      <div className="mt-4">
        <button onClick={onRetry} disabled={busy} className="rounded-lg bg-[#2563eb] px-4 py-2 text-white disabled:opacity-60">
          Yeniden Dene
        </button>
      </div>
      <div className="mt-2 text-xs text-slate-500">Moderatör odayı açtığında bağlantı hazır olacak.</div>
    </div>
  )
}
