// src/components/club/MeetingSection.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import clsx from 'clsx'

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
  const meetingEnabledFlag = (process.env.NEXT_PUBLIC_LIVEKIT_ENABLED || '0').toString().toLowerCase()
  const meetingEnabled = meetingEnabledFlag === '1' || meetingEnabledFlag === 'true' || meetingEnabledFlag === 'yes' || meetingEnabledFlag === 'on'
  if (!meetingEnabled) return null

  const [summary, setSummary] = React.useState<SummaryResponse | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [startText, setStartText] = React.useState<string>('')

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

  React.useEffect(() => {
    let alive = true
    async function poll() {
      try {
        const res = await fetch(`/api/meet/summary/${eventId}`, { cache: 'no-store' })
        if (!alive) return
        if (!res.ok) {
          setError('Oturum bilgisi alınamadı.')
          return
        }
        const data = (await res.json()) as SummaryResponse
        setSummary({
          present: data.present || [],
          absentCount: data.absentCount ?? 0,
          meetingActive: !!data.meetingActive,
          moderatorOnline: !!data.moderatorOnline,
        })
        setError(null)
      } catch (err: any) {
        if (!alive) return
        setError(err?.message || 'Oturum bilgisi alınamadı.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    poll()
    const t = setInterval(poll, 7000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [eventId])

  const canJoin = isMember || isModerator
  const participants = summary?.present ?? []
  const participantCount = participants.length
  const moderatorParticipant = React.useMemo(
    () => participants.find((p) => p.userId === moderatorId) ?? null,
    [participants, moderatorId],
  )

  return (
    <section className="rounded-[28px] border-2 border-[#2563eb]/25 bg-white shadow-sm">
      <header className="relative overflow-hidden rounded-t-[26px] bg-[#2563eb] px-6 py-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em]">Şu an devam eden oturum</div>
            <div className="mt-1 text-lg font-semibold">
              {summary?.meetingActive ? 'Yayın devam ediyor' : 'Oturum henüz başlamadı'}
            </div>
            <div className="mt-1 text-xs text-white/80" suppressHydrationWarning>
              {summary?.meetingActive ? 'Katılımcılar canlı yayın sayfasında.' : `Planlanan başlangıç: ${startText}`}
            </div>
          </div>
          <div className="flex flex-col items-end text-right text-xs uppercase tracking-widest text-white">
            <span className="text-[11px]">Katılımcı</span>
            <span className="text-2xl font-semibold leading-none">{participantCount}</span>
            <span className="mt-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium">
              Eksik {summary?.absentCount ?? '—'}
            </span>
          </div>
        </div>
        {summary?.meetingActive && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-white/40 via-white/70 to-white/40" />
        )}
      </header>

      <div className="grid gap-5 px-6 py-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Moderatör</div>
              <div className="mt-1 text-sm font-medium">{moderatorParticipant?.name ?? 'Moderatör'}</div>
            </div>
            <span
              className={clsx(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]',
                summary?.moderatorOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500',
              )}
            >
              {summary?.moderatorOnline ? 'Canlı' : 'Çevrimdışı'}
            </span>
          </div>

          <div className="mt-4 aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-900 text-center text-xs text-slate-300 shadow-inner sm:aspect-video md:aspect-[4/3]">
            {summary?.moderatorOnline ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                <div className="h-12 w-12 rounded-full border border-white/40 bg-white/10" />
                <span>Moderatör yayında · konferans odasında izleyebilirsiniz</span>
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                <div className="h-12 w-12 rounded-full border border-slate-500/40 bg-slate-700/60" />
                <span>Kamera henüz aktif değil</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Katılımcılar</div>
            {canJoin && (
              <Link
                href={`/meet/${encodeURIComponent(eventId)}`}
                className="inline-flex items-center rounded-full bg-[#2563eb] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#1d4ed8]"
              >
                Konferans Odasına Git
              </Link>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
          )}

          {loading && !error && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Oturum bilgileri getiriliyor…
            </div>
          )}

          {!loading && !error && participants.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Henüz kimse katılmadı. Oturum başlar başlamaz katılımcılar burada listelenecek.
            </div>
          )}

          {participants.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {participants.slice(0, 12).map((p) => (
                <li key={p.userId} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/70 to-blue-700/60 text-white shadow">
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-800">{p.name}</div>
                    <div className="truncate text-xs text-slate-500">@{p.handle}</div>
                  </div>
                  <span className="ml-auto text-[10px] uppercase tracking-[0.24em] text-slate-400">
                    {new Date(p.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {participants.length > 12 && (
            <div className="text-xs text-slate-500">
              Diğer {participants.length - 12} katılımcı konferans odasında.
            </div>
          )}

          {!canJoin && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              Bu konferansa yalnızca etkinlik üyeleri katılabilir. Üye olduğunuzda bağlantı burada belirecek.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
