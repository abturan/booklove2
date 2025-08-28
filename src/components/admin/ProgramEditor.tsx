// src/components/admin/ProgramEditor.tsx
'use client'

import { useState } from 'react'
import UploadInput from './UploadInput'

type Program = {
  id?: string
  isCurrent?: boolean
  note: string
  book: {
    id?: string
    title: string
    author: string
    translator?: string
    pageCount?: number | null
    isbn?: string
    blurb?: string
    coverUrl?: string
  }
}

export default function ProgramEditor({
  clubId,
  initialPrograms,
  initialStartsAt,
  editable,
}: {
  clubId: string
  initialPrograms: Program[]
  initialStartsAt: string
  editable: boolean
}) {
  const [programs, setPrograms] = useState<Program[]>(initialPrograms)
  const [startsAt, setStartsAt] = useState(initialStartsAt || '')
  const [draft, setDraft] = useState<Program>({
    note: '',
    book: { title: '', author: '', coverUrl: '' },
  })

  const create = async () => {
    if (!editable) {
      alert('Önce kulübü kaydedin.')
      return
    }
    if (!draft.book.title.trim()) {
      alert('Kitap adı gerekli.')
      return
    }
    const res = await fetch(`/api/admin/clubs/${clubId}/programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft, startsAt }),
    })
    if (!res.ok) {
      alert('Program eklenemedi.')
      return
    }
    const data = await res.json()
    setPrograms([data.program, ...programs])
    setDraft({ note: '', book: { title: '', author: '', coverUrl: '' } })
  }

  const update = async (p: Program) => {
    const res = await fetch(
      `/api/admin/clubs/${clubId}/programs/${p.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program: p }),
      }
    )
    if (!res.ok) {
      alert('Güncellenemedi.')
      return
    }
    alert('Güncellendi.')
  }

  const remove = async (p: Program) => {
    if (!confirm('Silinsin mi?')) return
    const res = await fetch(
      `/api/admin/clubs/${clubId}/programs/${p.id}`,
      { method: 'DELETE' }
    )
    if (!res.ok) {
      alert('Silinemedi.')
      return
    }
    setPrograms(programs.filter((x) => x.id !== p.id))
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm space-y-6">
      <h2 className="text-lg font-semibold">Aylık Programlar</h2>

      {/* Yeni program */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="block text-sm text-gray-600 mb-1">Oturum tarihi & saati</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
        <div className="space-y-3">
          <label className="block text-sm text-gray-600 mb-1">Kapak yükle / Kapak URL</label>
          <UploadInput
            folder="covers"
            value={draft.book.coverUrl || ''}
            onChange={(u) => setDraft({ ...draft, book: { ...draft.book, coverUrl: u } })}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="block text-sm text-gray-600 mb-1">Kitap adı</label>
          <input
            value={draft.book.title}
            onChange={(e) => setDraft({ ...draft, book: { ...draft.book, title: e.target.value } })}
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
        <div className="space-y-3">
          <label className="block text-sm text-gray-600 mb-1">Yazar</label>
          <input
            value={draft.book.author}
            onChange={(e) => setDraft({ ...draft, book: { ...draft.book, author: e.target.value } })}
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm text-gray-600 mb-1">Çevirmen</label>
          <input
            value={draft.book.translator || ''}
            onChange={(e) =>
              setDraft({ ...draft, book: { ...draft.book, translator: e.target.value } })
            }
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
        <div className="space-y-3">
          <label className="block text-sm text-gray-600 mb-1">Sayfa sayısı</label>
          <input
            type="number"
            value={draft.book.pageCount ?? ''}
            onChange={(e) =>
              setDraft({
                ...draft,
                book: { ...draft.book, pageCount: e.target.value ? Number(e.target.value) : null },
              })
            }
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm text-gray-600 mb-1">ISBN</label>
          <input
            value={draft.book.isbn || ''}
            onChange={(e) => setDraft({ ...draft, book: { ...draft.book, isbn: e.target.value } })}
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
        <div className="space-y-3">
          <label className="block text-sm text-gray-600 mb-1">Açıklama</label>
          <textarea
            value={draft.book.blurb || ''}
            onChange={(e) => setDraft({ ...draft, book: { ...draft.book, blurb: e.target.value } })}
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400"
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Program notu</label>
          <input
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400"
            placeholder="Bu ayın seçkisi…"
          />
        </div>
      </div>

      <div className="flex">
        <button
          type="button"
          onClick={create}
          className="rounded-xl bg-emerald-600 text-white px-4 py-2.5 hover:bg-emerald-700"
        >
          Yeni program ekle
        </button>
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-medium mb-3">Önceki programlar</h3>
        <div className="space-y-3">
          {programs.map((p) => (
            <div key={p.id} className="rounded-xl border p-3">
              <div className="font-medium">{p.book.title}</div>
              <div className="text-sm text-gray-600">{p.book.author}</div>
              <div className="mt-2 grid md:grid-cols-2 gap-3">
                <input
                  value={p.book.coverUrl || ''}
                  onChange={(e) =>
                    setPrograms((arr) =>
                      arr.map((x) =>
                        x.id === p.id ? { ...x, book: { ...x.book, coverUrl: e.target.value } } : x
                      )
                    )
                  }
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="Kapak URL"
                />
                <input
                  value={p.note}
                  onChange={(e) =>
                    setPrograms((arr) => arr.map((x) => (x.id === p.id ? { ...x, note: e.target.value } : x)))
                  }
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="Not"
                />
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => update(p)}
                  className="rounded-xl border px-3 py-1.5 hover:bg-gray-50"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => remove(p)}
                  className="rounded-xl border px-3 py-1.5 hover:bg-gray-50 text-rose-600"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
          {!programs.length && (
            <div className="text-sm text-gray-500">Henüz program yok.</div>
          )}
        </div>
      </div>
    </div>
  )
}
