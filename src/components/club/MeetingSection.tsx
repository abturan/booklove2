// src/components/club/MeetingSection.tsx
'use client'

import React from 'react'
import Link from 'next/link'

type PresentItem = {
  userId: string
  name: string
  handle: string
  joinedAt: string
  avatarUrl: string | null
}

type SummaryResponse = {
  present: PresentItem[]
  absentCount: number
  meetingActive: boolean
  meetingLive?: boolean
  moderatorOnline: boolean
}

export default function MeetingSection({
  eventId,
  eventStartsAt,
  isMember,
  isModerator,
  moderatorId,
}: {
  eventId: string
  eventStartsAt: string
  isMember: boolean
  isModerator: boolean
  moderatorId: string
}) {
  const meetingEnabledFlag = (
    process.env.NEXT_PUBLIC_MEETING_ENABLED ||
    process.env.NEXT_PUBLIC_JITSI_ENABLED ||
    process.env.NEXT_PUBLIC_LIVEKIT_ENABLED ||
    '0'
  )
    .toString()
    .toLowerCase()
  const meetingEnabled = meetingEnabledFlag === '1' || meetingEnabledFlag === 'true' || meetingEnabledFlag === 'yes' || meetingEnabledFlag === 'on'
  if (!meetingEnabled) return null

  const [summary, setSummary] = React.useState<SummaryResponse | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [startText, setStartText] = React.useState<string>('')
  const [activating, setActivating] = React.useState(false)
  const mountedRef = React.useRef(true)

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const startsAt = React.useMemo(() => new Date(eventStartsAt), [eventStartsAt])

  // Avoid hydration mismatch: format on client with fixed locale/timezone
  React.useEffect(() => {
    try {
      const fmt = new Intl.DateTimeFormat('tr-TR', {
        timeZone: 'Europe/Istanbul',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: undefined,
        hour12: false,
      })
      setStartText(fmt.format(startsAt))
    } catch {
      // Fallback: YYYY-MM-DD HH:mm
      const d = startsAt
      const pad = (n: number) => String(n).padStart(2, '0')
      setStartText(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`)
    }
  }, [startsAt])

  const fetchSummary = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/meet/summary/${eventId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Oturum bilgisi alınamadı.')
      const data = (await res.json()) as SummaryResponse
      if (!mountedRef.current) return
      setSummary({
        present: data.present || [],
        absentCount: data.absentCount ?? 0,
        meetingActive: !!data.meetingActive,
        meetingLive: !!data.meetingLive,
        moderatorOnline: !!data.moderatorOnline,
      })
      setError(null)
    } catch (err: any) {
      if (!mountedRef.current) return
      setError(err?.message || 'Oturum bilgisi alınamadı.')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [eventId])

  React.useEffect(() => {
    setLoading(true)
    setSummary(null)
    fetchSummary()
    const t = setInterval(fetchSummary, 7000)
    return () => clearInterval(t)
  }, [fetchSummary])

  const canJoin = isMember || isModerator
  const participants = summary?.present ?? []
  const participantCount = participants.length
  const roomUnlocked = summary?.meetingActive ?? false
  const roomLive = summary?.meetingLive ?? false

  const handleActivate = React.useCallback(async () => {
    try {
      setActivating(true)
      const res = await fetch('/api/meet/activate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Oda açılamadı.')
      }
      await fetchSummary()
      setError(null)
    } catch (err: any) {
      setError(err?.message || 'Oda açılamadı.')
    } finally {
      setActivating(false)
    }
  }, [eventId, fetchSummary])

  const statusTitle = roomUnlocked ? 'Oda açık' : 'Oda kapalı'
  const statusDescription = roomUnlocked
    ? roomLive
      ? 'Konferans odası açık; katılımcılar giriş yapabilir.'
      : 'Oda açıldı, katılımcılar bekleniyor.'
    : `Planlanan açılış: ${startText}`

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Konferans durumu</p>
          <p className="text-xl font-semibold text-slate-900">{statusTitle}</p>
          <p className="text-sm text-slate-600" suppressHydrationWarning>
            {statusDescription}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div className="font-semibold text-slate-900">{participantCount}</div>
          <div>Katılımcı</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</div>}
        {loading && !error && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">Durum güncelleniyor…</div>
        )}

        {canJoin ? (
          roomUnlocked ? (
            <Link
              href={`/meet/${encodeURIComponent(eventId)}`}
              className="inline-flex items-center rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              Konferans odasına git
            </Link>
          ) : isModerator ? (
            <button
              type="button"
              onClick={handleActivate}
              disabled={activating}
              className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {activating ? 'Açılıyor…' : 'Odayı aç'}
            </button>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Oda kilitli. Moderatör açtığında bağlantı burada görünecek.
            </div>
          )
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Konferans bağlantısı yalnızca etkinlik üyelerine görünür.
          </div>
        )}
      </div>
    </section>
  )
}
