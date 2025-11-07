// src/components/admin/ProgramForm.tsx
'use client'

import * as React from 'react'

export default function ProgramForm({ clubId }: { clubId: string }) {
  const [startsAt, setStartsAt] = React.useState('')
  const [coverUrl, setCoverUrl] = React.useState('')
  const [coverFile, setCoverFile] = React.useState<File | null>(null)
  const [title, setTitle] = React.useState('')
  const [author, setAuthor] = React.useState('')
  const [translator, setTranslator] = React.useState('')
  const [pages, setPages] = React.useState<string>('')
  const [isbn, setIsbn] = React.useState('')
  const [backText, setBackText] = React.useState('')
  const [note, setNote] = React.useState('')
  const [priceTRY, setPriceTRY] = React.useState('')
  const [capacity, setCapacity] = React.useState('')

  const [saving, setSaving] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)
  const [ok, setOk] = React.useState<string | null>(null)

  const canSave = !!startsAt && !!title.trim()

  async function safeJson(res: Response) {
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) return null
    try { return await res.json() } catch { return null }
  }

  function toISOZ(v: string) {
    if (!v) return ''
    return new Date(v).toISOString()
  }

  async function uploadCoverIfNeeded() {
    if (!coverFile) return null
    const fd = new FormData()
    fd.append('file', coverFile)
    try {
      const r = await fetch('/api/upload?scope=bookCover', { method: 'POST', body: fd })
      const j = await safeJson(r)
      if (!r.ok) {
        setErr(j?.error || 'Kapak yüklenemedi.')
        return null
      }
      return (j as any).url as string
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
    setOk(null)

    const priceValue = priceTRY ? Number(priceTRY.replace(',', '.')) : null
    if (priceValue !== null && (Number.isNaN(priceValue) || priceValue < 0)) {
      setSaving(false)
      setErr('Geçerli bir etkinlik ücreti girin.')
      return
    }

    const capacityValue =
      capacity.trim() === '' ? null : Number(capacity.replace(/[^\d-]/g, ''))
    if (capacityValue !== null && (!Number.isInteger(capacityValue) || capacityValue < 0)) {
      setSaving(false)
      setErr('Kapasite 0 veya pozitif tam sayı olmalı (boş = sınırsız).')
      return
    }

    let cover = coverUrl
    const uploaded = await uploadCoverIfNeeded()
    if (uploaded) cover = uploaded

    const payload = {
      startsAt: toISOZ(startsAt),
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
      priceTRY: priceValue,
      capacity: capacityValue,
    }

    try {
      const r = await fetch(`/api/admin/clubs/${clubId}/program`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await safeJson(r)
      if (!r.ok) {
        setErr(j?.error || 'Kaydedilemedi.')
      } else {
        setOk('Program kaydedildi.')
      }
    } catch (e: any) {
      setErr(e?.message || 'Sunucu hatası')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-2xl bg-white rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
      <div className="text-lg font-semibold ">Yeni program ekle</div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Oturum tarihi &amp; saati *</label>
        <input
          type="datetime-local"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          required
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Kitap adı *</label>
          <input
            className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Etkinlik ücreti (₺)</label>
          <input
            className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={priceTRY}
            onChange={(e) => setPriceTRY(e.target.value.replace(/[^0-9.,]/g, ''))}
            placeholder="Kulüp ücretini kullanmak için boş bırakın"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Kapasite</label>
          <input
            className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="Sınırsız için boş bırakın"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Yazar</label>
          <input
            className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Çevirmen</label>
          <input
            className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={translator}
            onChange={(e) => setTranslator(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Sayfa sayısı</label>
          <input
            inputMode="numeric"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={pages}
            onChange={(e) => setPages(e.target.value.replace(/[^\d]/g, ''))}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Kapak yükle / URL</label>
          <div className="flex items-center gap-3">
            <label className="inline-block">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              />
              <span className="inline-flex items-center justify-center px-4 h-9 rounded-full bg-gray-900 text-white cursor-pointer whitespace-nowrap min-w-[110px]">
                Dosya seç
              </span>
            </label>
            <input
              type="url"
              placeholder="veya https://…"
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
              value={coverUrl}
              onChange={(e) => {
                setCoverUrl(e.target.value)
                if (e.target.value) setCoverFile(null)
              }}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">ISBN</label>
          <input
            className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Açıklama / Not</label>
          <textarea
            rows={4}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Arka kapak</label>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={backText}
            onChange={(e) => setBackText(e.target.value)}
          />
        </div>
      </div>
      {err && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {err}
        </div>
      )}
      {ok && (
        <div className="rounded-xl bg-green-50 border border-green-200 text-green-800 px-3 py-2 text-sm">
          {ok}
        </div>
      )}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="px-4 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-sm"
          onClick={() => { setErr(null); setOk(null) }}
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={!canSave || saving}
          className="px-5 h-10 rounded-full text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving && (
            <span className="inline-block h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
          )}
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>
    </form>
  )
}
