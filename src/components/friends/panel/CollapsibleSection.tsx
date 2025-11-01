// src/components/friends/panel/CollapsibleSection.tsx
'use client'

import { useState } from 'react'

export default function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const n = Math.max(0, Number(count ?? 0))
  const label = n > 99 ? '99+' : String(n)
  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 ring-1 ${
          open ? 'ring-primary/60 bg-white' : 'ring-black/10 bg-white'
        }`}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-semibold text-slate-700">{title}</h4>
          <span
            className={`inline-flex min-w-[22px] h-5 px-1.5 items-center justify-center rounded-full text-[11px] font-bold ${
              open ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
            }`}
          >
            {label}
          </span>
        </div>
        <svg
          className={`text-primary transition-transform ${open ? 'rotate-180' : ''}`}
          width="18"
          height="18"
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </section>
  )
}
