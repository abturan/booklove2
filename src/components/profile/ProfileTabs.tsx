'use client'

import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'

type Item = { value: string; label: string }

export default function ProfileTabs({
  items,
  defaultValue,
  className,
  children,
}: {
  items: Item[]
  defaultValue?: string
  className?: string
  children: React.ReactNode
}) {
  // children içinden data-tab alan panelleri al
  const panes = useMemo(() => {
    const list: Record<string, React.ReactNode> = {}
    const kids = Array.isArray(children) ? (children as any[]) : [children]
    for (const node of kids) {
      if (node && typeof node === 'object' && 'props' in node && (node as any).props?.['data-tab']) {
        list[(node as any).props['data-tab']] = node
      }
    }
    return list
  }, [children])

  const initial = useMemo(() => {
    if (defaultValue && items.some(i => i.value === defaultValue)) return defaultValue
    return items[0]?.value ?? ''
  }, [defaultValue, items])

  const [active, setActive] = useState(initial)

  // defaultValue değişirse eşitle
  useEffect(() => setActive(initial), [initial])

  if (!items.length) return null

  return (
    <div className={clsx('w-full', className)}>
      <div className="w-full rounded-2xl bg-white/80 backdrop-blur p-1 ring-1 ring-black/5 shadow-sm grid grid-cols-3 gap-1">
        {items.map((t) => {
          const isActive = t.value === active
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setActive(t.value)}
              className={clsx(
                'h-11 rounded-xl text-sm font-semibold transition w-full',
                isActive ? 'bg-primary text-white shadow' : 'text-gray-700 hover:bg-gray-100'
              )}
              aria-pressed={isActive}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        {Object.entries(panes).map(([val, node]) => (
          <div key={val} hidden={val !== active} aria-hidden={val !== active}>
            {node}
          </div>
        ))}
      </div>
    </div>
  )
}
