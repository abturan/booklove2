// src/components/club/EventNavigation.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import clsx from 'clsx'

type EventNavItem = {
  id: string
  title: string
  startsAt: string
  status: 'active' | 'upcoming' | 'past'
}

type Mode = 'horizontal' | 'vertical'

const STATUS_STYLE: Record<
  EventNavItem['status'],
  { label: string; accent: string; badge: string; tile: string }
> = {
  active: {
    label: 'Aktif',
    accent: 'text-[#fa3d30]',
    badge: 'bg-[#fa3d30]/15 text-[#fa3d30]',
    tile: 'border-[#fa3d30]/40 bg-[#fa3d30]/12 text-[#fa3d30]',
  },
  upcoming: {
    label: 'Planlanan',
    accent: 'text-sky-600',
    badge: 'bg-sky-100 text-sky-700',
    tile: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  past: {
    label: 'Önceki',
    accent: 'text-slate-500',
    badge: 'bg-slate-100 text-slate-600',
    tile: 'border-slate-200 bg-slate-50 text-slate-600',
  },
}

export default function EventNavigation({
  events,
  activeId,
  onSelect,
  mode = 'horizontal',
  className,
  headerActions,
  verticalOffset = 0,
  visibleCount,
}: {
  events: EventNavItem[]
  activeId: string | null
  onSelect: (id: string) => void
  mode?: Mode
  className?: string
  headerActions?: ReactNode
  verticalOffset?: number
  visibleCount?: number
}) {
  if (!events.length) return null

  const horizontal = mode === 'horizontal'
  const [itemStride, setItemStride] = useState(0)

  const firstItemRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (horizontal) return
    if (typeof ResizeObserver === 'undefined') return
    const el = firstItemRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const height = el.offsetHeight
      const marginBottom = parseFloat(getComputedStyle(el).marginBottom || '0')
      setItemStride(height + marginBottom)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [horizontal, events.length])

  return (
    <section className={clsx('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-600">Oturumlar</h3>
        <div className="flex items-center gap-2">
          {headerActions}
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">Program</span>
        </div>
      </div>

      {horizontal ? (
        <div
          className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              active={event.id === activeId}
              horizontal
              onSelect={() => onSelect(event.id)}
            />
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden">
          <div
            className="flex flex-col gap-3 transition-transform duration-300 ease-out"
            style={{ transform: itemStride ? `translateY(-${verticalOffset * itemStride}px)` : undefined }}
          >
            {events.map((event) => (
              <div key={event.id} ref={event.id === events[0]?.id ? firstItemRef : undefined}>
                <EventCard
                  event={event}
                  active={event.id === activeId}
                  horizontal={false}
                  onSelect={() => onSelect(event.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function EventCard({
  event,
  active,
  horizontal,
  onSelect,
}: {
  event: EventNavItem
  active: boolean
  horizontal: boolean
  onSelect: () => void
}) {
  const status = STATUS_STYLE[event.status]
  const date = new Date(event.startsAt)
  const day = new Intl.DateTimeFormat('tr-TR', { day: '2-digit' }).format(date)
  const month = new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(date).toUpperCase()
  const time = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(date)
  const ref = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (active && horizontal && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    }
  }, [active, horizontal])

  return (
    <button
      type="button"
      onClick={onSelect}
      ref={ref}
      className={clsx(
        'group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all duration-200',
        horizontal ? 'min-w-[240px] shrink-0' : 'w-full',
        active
          ? 'border-transparent bg-[#fa3d30] text-white shadow-lg shadow-[#fa3d30]/25'
          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <div
        className={clsx(
          'flex h-12 w-12 flex-col items-center justify-center rounded-xl border text-center text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors',
          active ? 'border-white/70 bg-white/10 text-white' : status.tile,
        )}
      >
        <span className="text-lg leading-none">{day}</span>
        <span className="leading-none">{month}</span>
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
          <span className={clsx(active ? 'text-white/80' : 'text-slate-500')}>{time}</span>
          <span
            className={clsx(
              'rounded-full px-2.5 py-1 text-[10px] leading-none shadow-sm transition-colors',
              active ? 'bg-white/20 text-white shadow-none' : status.badge,
            )}
          >
            {status.label}
          </span>
        </div>
        <div className="text-sm font-semibold leading-tight truncate" title={event.title}>
          {event.title}
        </div>
        <div className={clsx('text-xs leading-snug', active ? 'text-white/75' : 'text-slate-500')}>
          {formatDateTR(event.startsAt)}
        </div>
      </div>
    </button>
  )
}

function formatDateTR(iso: string) {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
