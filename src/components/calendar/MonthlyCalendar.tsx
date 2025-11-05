// src/components/calendar/MonthlyCalendar.tsx
'use client'

import localFont from 'next/font/local'
import { useMemo } from 'react'
import Link from 'next/link'

// next/font/local expects a filesystem path relative to this file, not a public URL
const handFont = localFont({ src: '../../../public/fonts/FromWhereYouAre.ttf', variable: '--font-hand', display: 'swap' })

type CalendarEvent = { title: string; startsAt: string; href: string }

export default function MonthlyCalendar({ events }: { events: CalendarEvent[] }) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const cells = useMemo(() => {
    const arr: { day: number | null; items: CalendarEvent[] }[] = []
    const startWeekday = (monthStart.getDay() + 6) % 7 // Monday=0
    for (let i = 0; i < startWeekday; i++) arr.push({ day: null, items: [] })
    const byDay = new Map<number, CalendarEvent[]>()
    for (const e of events) {
      const d = new Date(e.startsAt)
      if (d.getMonth() !== monthStart.getMonth() || d.getFullYear() !== monthStart.getFullYear()) continue
      const k = d.getDate()
      const list = byDay.get(k) || []
      list.push(e)
      byDay.set(k, list)
    }
    for (let d = 1; d <= monthEnd.getDate(); d++) {
      arr.push({ day: d, items: byDay.get(d) || [] })
    }
    // pad to full rows (35 cells)
    while (arr.length % 7 !== 0) arr.push({ day: null, items: [] })
    return arr
  }, [events])

  const monthLabel = now.toLocaleDateString('tr-TR', { month: 'long' }).toUpperCase()

  return (
    <section className={`${handFont.variable}`}>
      <div className="rounded-3xl p-3" style={{ backgroundImage: 'url(/bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="rounded-2xl bg-white/90 p-3 shadow-sm">
          <div className="mb-2 text-center" style={{ fontFamily: 'var(--font-hand)' }}>
            <div className="text-rose-600 text-xl font-bold tracking-wider">{monthLabel} TAKVİMİ</div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map((w) => (
              <div key={w} className="text-center text-[11px] text-gray-500">{w}</div>
            ))}
          {cells.map((c, idx) => (
            <div key={idx} className="min-h-[56px] rounded-lg border border-rose-200 bg-rose-50/30 p-1">
              <div className="text-[11px] text-rose-700">{c.day ?? ''}</div>
              <ul className="mt-0.5 space-y-0.5">
                {c.items.map((item, i) => (
                  <li key={i} className="text-[11px] font-semibold text-gray-900">
                    <Link href={item.href} className="hover:underline">
                      • {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
)
}
