'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

export default function ProgramForm({ clubId }: { clubId: string }) {
  const router = useRouter()

  // Form state
  const [startsAt, setStartsAt] = React.useState('') // datetime-local string
  const [coverUrl, setCoverUrl] = React.useState('')
  const [coverFile, setCoverFile] = React.useState<File | null>(null)
  const [title, setTitle] = React.useState('')
  const [author, setAuthor] = React.useState('')
  const [translator, setTranslator] = React.useState('')
  const [pages, setPages] = React.useState<number | ''>('')
  const [isbn, setIsbn] = React.useState('')
  const [backText, setBackText] = React.useState('')
  const [note, setNote] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  const canSave = !!startsAt && !!title.trim()

  async function uploadCoverIfNeeded() {
    if (!coverFile) return null
    const fd = new FormData()
    fd.append('file', coverFile)
    try {
      const r = await fetch('/api/upload?scope=bookCover', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok) {
        setErr(j?.error || 'Kapak yüklenemedi.')
        return null
      }
      return j.url as string
    } catch {
      setErr('Kapak yüklenemedi.')
      return null
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave || saving) return
    setSaving(true)
    setErr(null)

    let cover = coverUrl
    const uploaded = await uploadCoverIfNeeded()
    if (uploaded) cover = uploaded

    const payload = {
      startsAt, // ISO'ya çevrimi API yapacak
      book: {
        title: title.trim(),
        author: author.trim() || null,
        translator: translator.trim() || null,
        pages: pages ? Number(pages) : null,
        coverUrl: cover || null,
        backText: backText.trim() || null,
        isbn: isbn.trim() || null,
      },
      note: note.trim() || null,
    }

    try {
      const r = await fetch(`/api/admin/clubs/${clubId}/program`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await r.json()
      if (!r.ok) {
        setErr(typeof j === 'string' ? j : (j?.error || 'Kaydedilemedi.'))
      } else {
        // Başarılı -> edit sayfasına dön
        router.push(`/admin/clubs/${clubId}/edit`)
        router.refresh()
      }
    } catch (e: any) {
      setErr(e?.message || 'Sunucu hatası')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-gray-600">Oturum tarihi & saati *</label>
        <input
          type="datetime-local"
          className="w-full rounded-2xl border px-4 py-3"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600">Kapak görseli</label>
        <div className="flex gap-3">
          <label className="inline-block">
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
            <span className="cursor-pointer rounded-xl px-4 py-2 bg-gray-900 text-white">
              Dosya seç
            </span>
          </label>
          <input
            type="url"
            placeholder="veya https://…"
            className="flex-1 rounded-2xl border px-4 py-3"
            value={coverUrl}
            onChange={(e) => {
              setCoverUrl(e.target.value)
              if (e.target.value) setCoverFile(null)
            }}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600">Kitap adı *</label>
        <input
          className="w-full rounded-2xl border px-4 py-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600">Yazar</label>
        <input
          className="w-full rounded-2xl border px-4 py-3"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600">Çevirmen</label>
          <input
            className="w-full rounded-2xl border px-4 py-3"
            value={translator}
            onChange={(e) => setTranslator(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Sayfa sayısı</label>
          <input
            type="number"
            className="w-full rounded-2xl border px-4 py-3"
            value={pages}
            onChange={(e) => setPages(e.target.value ? Number(e.target.value) : '')}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600">ISBN</label>
        <input
          className="w-full rounded-2xl border px-4 py-3"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600">Arka kapak</label>
        <textarea
          rows={3}
          className="w-full rounded-2xl border px-4 py-3"
          value={backText}
          onChange={(e) => setBackText(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600">Açıklama / Not</label>
        <textarea
          rows={3}
          className="w-full rounded-2xl border px-4 py-3"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {err && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSave || saving}
        className="rounded-full bg-rose-600 text-white px-5 py-2 disabled:opacity-50"
      >
        {saving ? 'Kaydediliyor…' : 'Programı ekle'}
      </button>
    </form>
  )
}
