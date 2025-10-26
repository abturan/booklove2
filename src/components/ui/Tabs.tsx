// src/components/ui/Tabs.tsx
'use client'

import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { useBuddyCounts } from '@/components/friends/hooks/useBuddyCounts'

type Tab = { value: string; label: string; badge?: number }
type Props = {
  value: string
  onValueChange?: (v: string) => void
  tabs: Tab[]
  className?: string
}

export default function Tabs({ value, onValueChange, tabs, className }: Props) {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch('/api/auth/session', { cache: 'no-store' })
        const j = await r.json().catch(() => null)
        if (alive) setAuthed(!!j?.user)
      } catch {
        if (alive) setAuthed(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // Buddy sayaçlarını (istek + okunmamış DM) sekme bileşeni içinde topla
  const { pendingCount, unreadDm } = useBuddyCounts(Boolean(authed))
  const buddyTotal = (pendingCount || 0) + (unreadDm || 0)

  const filteredTabs =
    authed === false
      ? tabs.filter(
          (t) => !/book.?buddy/i.test(t.label) && !/book.?buddy/i.test(t.value)
        )
      : tabs

  const cols =
    filteredTabs.length === 2
      ? 'grid-cols-2'
      : filteredTabs.length === 3
      ? 'grid-cols-3'
      : filteredTabs.length === 4
      ? 'grid-cols-4'
      : 'grid-cols-2'

  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx('w-full rounded-2xl bg-white/80 backdrop-blur p-1 ring-1 ring-black/5 shadow-sm grid gap-1', cols)}>
        {filteredTabs.map((t) => {
          const active = t.value === value
          const isBuddyTab = /book.?buddy/i.test(t.label) || /book.?buddy/i.test(t.value)

          // Buddy sekmesi için: rozet = bekleyen + okunmamış DM
          // Diğerleri için: verilen badge değeri
          const raw = t.badge ?? 0
          const n = isBuddyTab ? buddyTotal : raw

          const hasBadge = n > 0
          const big = n > 99

          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onValueChange?.(t.value)}
              className={clsx(
                'h-11 rounded-xl text-sm font-semibold transition w-full flex items-center justify-center gap-2',
                active ? 'bg-primary text-white shadow' : 'text-gray-700 hover:bg-gray-100'
              )}
              aria-pressed={active}
            >
              <span>{t.label}</span>
              {hasBadge && (
                <span
                  className={clsx(
                    'inline-flex items-center justify-center text-[11px] font-bold',
                    big ? 'h-5 min-w-[28px] px-1.5 rounded-full' : 'h-5 w-5 rounded-full',
                    active ? 'bg-white text-primary' : 'bg-primary text-white'
                  )}
                >
                  {big ? '99+' : n}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
