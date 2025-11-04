// src/app/meet/[eventId]/LiveClient.tsx
'use client'

import React from 'react'
import LiveRoom from '@/components/meet/LiveRoom'

export default function LiveClient({ eventId, isModerator, moderatorId, meId }: { eventId: string; isModerator: boolean; moderatorId: string; meId: string }) {
  const [token, setToken] = React.useState<string | null>(null)
  const [wsUrl, setWsUrl] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string>('')
  const [busy, setBusy] = React.useState<boolean>(false)
  const [mayPublish, setMayPublish] = React.useState<boolean>(true)
  const [deviceId, setDeviceId] = React.useState<string>('')

  // Persist a deviceId in localStorage so multiple devices of same user can join
  React.useEffect(() => {
    try {
      const k = 'bk_device_id'
      const prev = localStorage.getItem(k)
      if (prev && prev.length >= 6) setDeviceId(prev)
      else {
        const r = Math.random().toString(36).slice(2, 10)
        localStorage.setItem(k, r)
        setDeviceId(r)
      }
    } catch {}
  }, [])

  const fetchToken = React.useCallback(async () => {
    try {
      setBusy(true)
      // Ensure presence
      await fetch('/api/meet/presence/enter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ eventId }),
      }).catch(() => {})

      const r = await fetch('/api/meet/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ eventId, deviceId }),
      })
      const j = await r.json().catch(() => ({}))
      if (r.status === 409 && isModerator) {
        // Try to auto-activate for moderators
        await fetch('/api/meet/activate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ eventId }),
        }).catch(() => {})
        const r2 = await fetch('/api/meet/token', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ eventId, deviceId }),
        })
        const j2 = await r2.json().catch(() => ({}))
        if (r2.ok && j2?.token && j2?.wsUrl) {
          setToken(j2.token)
          setWsUrl(j2.wsUrl)
          setMayPublish(!!j2?.canPublish)
          setMessage('')
          return
        }
      }
      if (!r.ok || !j?.token || !j?.wsUrl) {
        const reason = j?.error || (r.status === 409 ? 'Oda henüz aktif değil; moderatörü bekleyin.' : 'Token alınamadı')
        setMessage(reason)
        return
      }
      setToken(j.token)
      setWsUrl(j.wsUrl)
      setMayPublish(!!j?.canPublish)
      setMessage('')
    } finally {
      setBusy(false)
    }
  }, [eventId, isModerator])

  React.useEffect(() => {
    fetchToken()
    const int = setInterval(() => {}, 60000)
    return () => clearInterval(int)
  }, [fetchToken])

  const onLeave = async () => {
    try { await fetch('/api/meet/presence/leave', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventId }) }) } catch {}
  }

  if (token && wsUrl) {
    return <LiveRoom token={token} serverUrl={wsUrl} onLeave={onLeave} moderatorId={moderatorId} isModerator={isModerator} eventId={eventId} />
  }

  return (
    <div className="grid min-h-[70vh] place-items-center">
      <StatusCard
        busy={busy}
        message={message}
        onRetry={() => fetchToken()}
        eventId={eventId}
        meId={meId}
        onPublishAllowed={() => fetchToken()}
      />
    </div>
  )
}

function StatusCard({ busy, message, onRetry, eventId, meId, onPublishAllowed }: { busy: boolean; message: string; onRetry: () => void; eventId: string; meId: string; onPublishAllowed: () => void }) {
  // Poll meeting list to learn when moderator grants publish permission
  React.useEffect(() => {
    let alive = true
    async function poll() {
      try {
        const r = await fetch(`/api/meet/list/${eventId}`, { cache: 'no-store' })
        const j = await r.json().catch(() => null)
        if (!alive || !j?.present) return
        const me = j.present.find((p: any) => p.userId === meId)
        if (me?.allowSpeak) {
          onPublishAllowed()
        }
      } catch {}
    }
    const t = setInterval(poll, 5000)
    poll()
    return () => { alive = false; clearInterval(t) }
  }, [eventId, meId, onPublishAllowed])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-700">
      <div className="mb-2 text-sm">Bağlantı hazırlanıyor…</div>
      {message && <div className="text-sm text-amber-700">{message}</div>}
      <div className="mt-4">
        <button onClick={onRetry} disabled={busy} className="rounded-lg bg-[#2563eb] px-4 py-2 text-white disabled:opacity-60">
          Yeniden Dene
        </button>
      </div>
      <div className="mt-2 text-xs text-slate-500">Moderatör izin verdiğinde yayın otomatik açılmaya hazır.</div>
    </div>
  )
}
