// src/components/ui/Tabs.tsx
'use client'

import clsx from 'clsx'

type Tab = { value: string; label: string }
type Props = {
  value: string
  onValueChange?: (v: string) => void
  tabs: Tab[]
  className?: string
}

export default function Tabs({ value, onValueChange, tabs, className }: Props) {
  return (
    <div className={clsx('w-full', className)}>
      <div className="w-full rounded-2xl bg-white/80 backdrop-blur p-1 ring-1 ring-black/5 shadow-sm grid grid-cols-3 gap-1">
        {tabs.map((t) => {
          const active = t.value === value
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onValueChange?.(t.value)}
              className={clsx(
                'h-11 rounded-xl text-sm font-semibold transition w-full',
                active
                  ? 'bg-primary text-white shadow'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
              aria-pressed={active}
            >
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
