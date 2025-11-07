// src/components/admin/UploadInput.tsx
'use client'

import { useRef } from 'react'

export default function UploadInput({
  folder,
  value,
  onChange,
  help,
}: {
  folder: string
  value: string
  onChange: (url: string) => void
  help?: string
}) {
  const ref = useRef<HTMLInputElement>(null)

  const onFile = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)
    const r = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!r.ok) {
      alert('Dosya yüklenemedi.')
      return
    }
    const data = await r.json()
    onChange(data.url)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="rounded-xl bg-gray-900 text-white px-4 py-2 hover:bg-black"
        >
          Dosya seç
        </button>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
          }}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="veya https://…"
          className="flex-1 rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400"
        />
      </div>
      {help && <p className="text-xs text-gray-500">{help}</p>}
    </div>
  )
}
