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
  const cols =
    tabs.length === 2
      ? 'grid-cols-2'
      : tabs.length === 3
      ? 'grid-cols-3'
      : tabs.length === 4
      ? 'grid-cols-4'
      : 'grid-cols-2'

  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx('w-full rounded-2xl bg-white/80 backdrop-blur p-1 ring-1 ring-black/5 shadow-sm grid gap-1', cols)}>
        {tabs.map((t) => {
          const active = t.value === value
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onValueChange?.(t.value)}
              className={clsx(
                'h-11 rounded-xl text-sm font-semibold transition w-full',
                active ? 'bg-primary text-white shadow' : 'text-gray-700 hover:bg-gray-100'
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
