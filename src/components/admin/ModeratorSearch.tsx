'use client'

import * as React from 'react'

type UserLite = { id: string; name: string | null; email: string | null }
export default function ModeratorSearch(props: {
  value?: UserLite | null
  onChange: (user: UserLite | null) => void
  label?: string
  placeholder?: string
}) {
  const { value, onChange, label = 'Moderatör *', placeholder = 'İsim ya da e-posta ile ara…' } = props
  const [q, setQ] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [items, setItems] = React.useState<UserLite[]>([])
  const [open, setOpen] = React.useState(false)
  const boxRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const h = setTimeout(async () => {
      if (!q.trim()) { setItems([]); return }
      setLoading(true)
      try {
        const r = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`)
        const j = await r.json()
        setItems(j.items || [])
      } catch (_) {
        setItems([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(h)
  }, [q])

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current) return
      if (!boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="space-y-2" ref={boxRef}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {value ? (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-3 py-1 text-sm">
            {value.name || 'İsimsiz'} <span className="opacity-60 ml-2">({value.email || '—'})</span>
          </span>
          <button
            type="button"
            className="text-sm px-3 py-1 rounded-full border hover:bg-gray-50"
            onClick={() => onChange(null)}
          >
            Değiştir
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-300"
          />
          {open && (
            <div className="absolute z-10 mt-2 w-full rounded-2xl border bg-white shadow">
              {loading && <div className="px-4 py-3 text-sm text-gray-600">Yükleniyor…</div>}
              {!loading && items.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-600">Sonuç yok.</div>
              )}
              {!loading &&
                items.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onChange(u)
                      setQ('')
                      setOpen(false)
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <span className="text-sm">{u.name || 'İsimsiz'}</span>
                    <span className="text-xs text-gray-500">{u.email}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
