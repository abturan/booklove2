'use client'

import { useEffect, useState } from 'react'

type U = { id: string; name: string | null; email: string | null; role: string | null }

export default function ModeratorPicker({
  initial,
  onSelect,
}: {
  initial?: U
  onSelect: (u: U) => void
}) {
  const [q, setQ] = useState('')
  const [list, setList] = useState<U[]>([])
  const [picked, setPicked] = useState<U | undefined>(initial)

  useEffect(() => {
    let ignore = false
    const run = async () => {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`)
      if (!res.ok) return
      const data = (await res.json()) as { items: U[] }
      if (!ignore) setList(data.items || [])
    }
    if (q.trim().length >= 1) run()
    else setList([])
    return () => {
      ignore = true
    }
  }, [q])

  return (
    <div className="space-y-2">
      {picked ? (
        <div className="flex items-center gap-2">
          <div className="text-sm">
            Seçilen: <span className="font-medium">{picked.name || picked.email}</span>
            {picked.role ? (
              <span className="ml-2 text-xs text-gray-600">({picked.role})</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setPicked(undefined)}
            className="px-2 py-1 rounded-full bg-gray-200 text-sm"
          >
            Değiştir
          </button>
        </div>
      ) : (
        <>
          <input
            className="form-input w-full"
            placeholder="İsim ya da e-posta ile ara…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {!!list.length && (
            <div className="rounded-xl border overflow-hidden">
              {list.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setPicked(u)
                    onSelect(u)
                    setList([])
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                >
                  <div className="font-medium text-sm">{u.name || '-'}</div>
                  <div className="text-xs text-gray-600">{u.email}</div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
