// src/components/profile/fb/Tabs.tsx
'use client'

type V = 'gonderiler' | 'diger'
export default function Tabs({
  value,
  onChange,
  tabs,
}: {
  value: V
  onChange: (v: V) => void
  tabs: { value: V; label: string }[]
}) {
  return (
    <div className="mt-2">
      <div className="flex gap-6 border-b border-gray-200">
        {tabs.map((t) => {
          const active = t.value === value
          return (
            <button
              key={t.value}
              onClick={() => onChange(t.value)}
              className={`py-3 text-[15px] font-semibold ${
                active
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
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
