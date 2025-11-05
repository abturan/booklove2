// src/components/home/HomeCalendar.tsx
'use client'

import { useEffect, useState } from 'react'
import MonthlyCalendar from '@/components/calendar/MonthlyCalendar'

type ApiEvent = {
  id: string
  title: string
  startsAt: string
  clubSlug: string | null
  clubName: string | null
}

type CalendarEvent = {
  title: string
  startsAt: string
  href: string
}

export default function HomeCalendar() {
  const enabled = process.env.NEXT_PUBLIC_HOME_CALENDAR_ENABLED
  if (!(enabled && (enabled === '1' || enabled.toLowerCase() === 'true'))) {
    return null
  }

  const [events, setEvents] = useState<CalendarEvent[] | null>(null)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/events/monthly', { cache: 'no-store' })
        if (!res.ok) throw new Error('Etkinlikler getirilemedi')
        const data = await res.json()
        if (!active) return
        const transformed: CalendarEvent[] = (data?.events as ApiEvent[] | undefined)?.map((ev) => ({
          title: buildLabel(ev),
          startsAt: ev.startsAt,
          href: ev.clubSlug ? `/clubs/${ev.clubSlug}` : '#',
        })) ?? []
        setEvents(transformed)
      } catch (err) {
        if (active) setError(true)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white/80 p-6 text-sm text-rose-600">
        Takvim verileri şu anda yüklenemiyor.
      </div>
    )
  }

  if (!events) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-white/70 p-6 text-sm text-gray-500">
        Takvim yükleniyor…
      </div>
    )
  }

  return <MonthlyCalendar events={events} />
}

function buildLabel(event: ApiEvent): string {
  const club = event.clubName?.trim()
  const title = event.title?.trim()
  if (club && title) return `${club} · ${title}`
  if (club) return club
  return title || 'Etkinlik'
}
