// src/components/clubs/ClubsSearchBar.tsx
'use client'

import { useState } from 'react'

export default function ClubsSearchBar({
  defaultValue,
  onSearch,
}: {
  defaultValue?: string
  onSearch: (q: string) => void
}) {
  const [q, setQ] = useState(defaultValue || '')
  return (
    <div className="flex items-center gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSearch(q.trim()) }}
        placeholder="Yazar, kulüp veya moderatör ara…"
        className="flex-1 rounded-2xl border px-4 py-2.5"
      />
      <button className="rounded-2xl px-4 py-2.5 bg-gray-900 text-white" onClick={() => onSearch(q.trim())}>
        Ara
      </button>
    </div>
  )
}
