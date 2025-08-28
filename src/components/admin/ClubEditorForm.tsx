// src/components/admin/ClubEditorForm.tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

type ModeratorLite = { id: string; name: string; email: string | null }

type InitialClub = {
  id: string
  name: string
  slug: string
  description: string
  bannerUrl: string
  priceTRY: number
  moderator: ModeratorLite | null
}

type ProgramLite = {
  id: string
  monthKey: string
  isCurrent: boolean
  note: string
  book: {
    title: string
    author: string
    translator: string
    pages: number | null
    coverUrl: string
    isbn: string
  }
}

function monthKeyFromISO(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export default function ClubEditorForm({
  initialClub,
  initialPrograms,
}: {
  initialClub: InitialClub
  initialPrograms: ProgramLite[]
}) {
  const router = useRouter()

  const slugifyTr = (s: string) =>
    s
      .toLowerCase()
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/[ıİ]/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

  const moneyToNumber = (v: string) =>
    Number(String(v).replace(',', '.').replace(/[^\d.]/g, ''))

  // ---- club state
  const [name, setName] = React.useState(initialClub.name ?? '')
  const [computedSlug, setComputedSlug] = React.useState(
    initialClub.slug || slugifyTr(initialClub.name || '')
  )
  const [priceTRY, setPriceTRY] = React.useState(String(initialClub.priceTRY ?? 0))
  const [description, setDescription] = React.useState(initialClub.description ?? '')
  const [bannerUrl, setBannerUrl] = React.useState(initialClub.bannerUrl ?? '')
  const [bannerFile, setBannerFile] = React.useState<File | null>(null)

  const [saving, setSaving] = React.useState(false)
  const [nameErr, setNameErr] = React.useState<string | null>(null)
  const [priceErr, setPriceErr] = React.useState<string | null>(null)
  const [moderatorErr, setModeratorErr] = React.useState<string | null>(null)
  const [serverErr, setServerErr] = React.useState<string | null>(null)

  // ---- moderator search
  const [moderatorQuery, setModeratorQuery] = React.useState(
    initialClub.moderator ? `${initialClub.moderator.name}` : ''
  )
  const [moderator, setModerator] = React.useState<ModeratorLite | null>(
    initialClub.moderator
  )
  const [options, setOptions] = React.useState<ModeratorLite[]>([])
  const [openList, setOpenList] = React.useState(false)
  const [searching, setSearching] = React.useState(false)

  // ---- programs
  const [programs, setPrograms] = React.useState<ProgramLite[]>(initialPrograms)

  React.useEffect(() => {
    setComputedSlug(slugifyTr(name || ''))
  }, [name])

  React.useEffect(() => {
    const q = moderatorQuery.trim()
    if (!openList || q.length < 2) return
    let active = true
    ;(async () => {
      try {
        setSearching(true)
        const r = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`)
        const data = (await r.json()) as { users: ModeratorLite[] }
        if (!active) return
        setOptions(data.users || [])
      } catch {
      } finally {
        if (active) setSearching(false)
      }
    })()
    return () => {
      active = false
    }
  }, [moderatorQuery, openList])

  const onPickModerator = (u: ModeratorLite) => {
    setModerator(u)
    setModeratorQuery(u.name || u.email || '')
    setOpenList(false)
    setModeratorErr(null)
  }

  const onBannerFile = async (file: File | null) => {
    setServerErr(null)
    if (!file) {
      setBannerFile(null)
      return
    }
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setServerErr('Sadece PNG/JPG yükleyebilirsiniz.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setServerErr('Dosya en fazla 2MB olmalı.')
      return
    }
    setBannerFile(file)
    const reader = new FileReader()
    reader.onload = () => setBannerUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const uploadBannerIfNeeded = async (): Promise<string | null> => {
    if (!bannerFile) return null
    const fd = new FormData()
    fd.append('file', bannerFile)
    try {
      const res = await fetch('/api/upload?scope=banner', { method: 'POST', body: fd })
      const j = await res.json()
      if (!res.ok) {
        setServerErr(j?.error || 'Banner yüklenemedi.')
        return null
      }
      return j.url as string
    } catch {
      setServerErr('Banner yüklenemedi.')
      return null
    }
  }

  const validateClub = () => {
    let ok = true
    if (!name.trim()) {
      setNameErr('Kulüp adı zorunlu.')
      ok = false
    } else setNameErr(null)

    const money = moneyToNumber(priceTRY)
    if (Number.isNaN(money) || money < 0) {
      setPriceErr('Geçerli bir ücret girin (negatif olamaz).')
      ok = false
    } else setPriceErr(null)

    if (!moderator?.id) {
      setModeratorErr('Moderatör seçin.')
      ok = false
    } else setModeratorErr(null)

    return ok
  }

  const submitClub = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerErr(null)
    if (saving) return
    if (!validateClub()) return
    setSaving(true)

    let bannerToUse = bannerUrl
    const uploaded = await uploadBannerIfNeeded()
    if (uploaded) bannerToUse = uploaded

    try {
      const res = await fetch(`/api/admin/clubs/${initialClub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          priceTRY: moneyToNumber(priceTRY),
          description: description.trim(),
          bannerUrl: bannerToUse || null,
          moderatorId: moderator?.id || null,
        }),
      })
      const j = await res.json()
      if (!res.ok) {
        const msg = typeof j === 'string' ? j : j?.error || 'Kaydedilemedi.'
        setServerErr(msg)
      } else {
        router.refresh()
      }
    } catch {
      setServerErr('Sunucu hatası. Lütfen tekrar deneyin.')
    } finally {
      setSaving(false)
    }
  }

  // ========= Program Modal =========
  function ProgramModal({
    open,
    onClose,
    mode, // 'new' | 'edit'
    clubId,
    program,
  }: {
    open: boolean
    onClose: () => void
    mode: 'new' | 'edit'
    clubId: string
    program?: ProgramLite
  }) {
    const [startsAt, setStartsAt] = React.useState<string>('')
    const [title, setTitle] = React.useState(program?.book.title || '')
    const [author, setAuthor] = React.useState(program?.book.author || '')
    const [translator, setTranslator] = React.useState(program?.book.translator || '')
    const [pages, setPages] = React.useState<number | ''>(program?.book.pages ?? '')
    const [coverUrl, setCoverUrl] = React.useState(program?.book.coverUrl || '')
    const [coverFile, setCoverFile] = React.useState<File | null>(null)
    const [isbn, setIsbn] = React.useState(program?.book.isbn || '')
    const [note, setNote] = React.useState(program?.note || '')
    const [savingProgram, setSavingProgram] = React.useState(false)
    const [err, setErr] = React.useState<string | null>(null)

    React.useEffect(() => {
      if (!open) {
        setStartsAt('')
        setErr(null)
      }
    }, [open])

    const uploadCoverIfNeeded = async () => {
      if (!coverFile) return null
      const fd = new FormData()
      fd.append('file', coverFile)
      const r = await fetch('/api/upload?scope=bookCover', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok) {
        setErr(j?.error || 'Kapak yüklenemedi.')
        return null
      }
      return j.url as string
    }

    const canSave =
      (mode === 'new' ? !!startsAt : true) && !!title.trim() && !savingProgram

    async function onSave(e: React.FormEvent) {
      e.preventDefault()
      if (!canSave) return
      setSavingProgram(true)
      setErr(null)

      let cover = coverUrl
      const up = await uploadCoverIfNeeded()
      if (up) cover = up

      try {
        if (mode === 'new') {
          const payload = {
            startsAt,
            book: {
              title: title.trim(),
              author: author.trim() || null,
              translator: translator.trim() || null,
              pages: pages ? Number(pages) : null,
              coverUrl: cover || null,
              isbn: isbn || null,
            },
            note: note.trim() || null,
            monthKey: monthKeyFromISO(startsAt),
          }
          const r = await fetch(`/api/admin/clubs/${clubId}/program`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const j = await r.json()
          if (!r.ok) throw new Error(j?.error || 'Kaydedilemedi.')
        } else if (mode === 'edit' && program) {
          const payload: any = {
            startsAt: startsAt || null,
            book: {
              title: title.trim(),
              author: author.trim() || null,
              translator: translator.trim() || null,
              pages: pages ? Number(pages) : null,
              coverUrl: cover || null,
              isbn: isbn || null,
            },
            note: note.trim() || null,
          }
          const r = await fetch(`/api/admin/picks/${program.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const j = await r.json()
          if (!r.ok) throw new Error(j?.error || 'Güncellenemedi.')
        }
        onClose()
        router.refresh()
      } catch (e: any) {
        setErr(e?.message || 'İşlem başarısız.')
      } finally {
        setSavingProgram(false)
      }
    }

    async function onDelete() {
      if (!program) return
      if (!confirm('Program silinsin mi? Bu işlem geri alınamaz.')) return
      try {
        const r = await fetch(`/api/admin/picks/${program.id}`, { method: 'DELETE' })
        const j = await r.json()
        if (!r.ok) throw new Error(j?.error || 'Silinemedi.')
        onClose()
        router.refresh()
      } catch (e: any) {
        setErr(e?.message || 'Silme başarısız.')
      }
    }

    if (!open) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-full  rounded-2xl bg-white p-5 shadow-xl w-full max-w-2xl bg-white rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold mb-3">
            {mode === 'new' ? 'Yeni program ekle' : 'Programı düzenle'}
          </h3>
          <form onSubmit={onSave} className="space-y-4">
            {mode === 'new' && (
              <div>
                <label className="block text-sm text-gray-600">Oturum tarihi & saati *</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-2xl border px-3 py-2"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600">Kitap adı *</label>
                <input
                  className="w-full rounded-2xl border px-3 py-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Yazar</label>
                <input
                  className="w-full rounded-2xl border px-3 py-2"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Çevirmen</label>
                <input
                  className="w-full rounded-2xl border px-3 py-2"
                  value={translator}
                  onChange={(e) => setTranslator(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Sayfa sayısı</label>
                <input
                  type="number"
                  className="w-full rounded-2xl border px-3 py-2"
                  value={pages}
                  onChange={(e) =>
                    setPages(e.target.value ? Number(e.target.value) : '')
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 pb-5">Kapak yükle / URL</label>
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
                  type="text"
                  placeholder="https://…"
                  className="flex-1 rounded-2xl border px-3 py-2"
                  value={coverUrl}
                  onChange={(e) => {
                    setCoverUrl(e.target.value)
                    if (e.target.value) setCoverFile(null)
                  }}
                />
                
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600">ISBN</label>
              <input
                className="w-full rounded-2xl border px-3 py-2"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600">Açıklama / Not</label>
              <textarea
                className="w-full rounded-2xl border px-3 py-2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {err && (
              <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                {err}
              </div>
            )}

            <div className="flex items-center gap-3 justify-end">
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-full px-4 py-2 border text-rose-600"
                >
                  Sil
                </button>
              )}
              <button type="button" onClick={onClose} className="rounded-full px-4 py-2 border">
                İptal
              </button>
              <button
                type="submit"
                disabled={!canSave}
                className="rounded-full px-4 py-2 bg-rose-600 text-white disabled:opacity-50"
              >
                {savingProgram ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }
  // ========= Program Modal son =========

  // Modal state
  const [modalOpen, setModalOpen] = React.useState(false)
  const [modalMode, setModalMode] = React.useState<'new' | 'edit'>('new')
  const [editingProgram, setEditingProgram] = React.useState<ProgramLite | undefined>(
    undefined
  )

  return (
    <>
      {/* Kulüp formu */}
      <form onSubmit={submitClub} className="space-y-8">
        {/* Banner */}
        <section className="rounded-3xl border bg-white/70 backdrop-blur p-5 space-y-3 shadow-sm">
          <h2 className="text-base font-medium">Banner görseli</h2>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-block">
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => onBannerFile(e.target.files?.[0] ?? null)}
              />
              <span className="cursor-pointer rounded-xl px-4 py-2 bg-gray-900 text-white">
                Dosya seç
              </span>
            </label>
            <input
              type="url"
              placeholder="veya https://…"
              className="w-72 rounded-2xl border px-3 py-2"
              value={bannerUrl}
              onChange={(e) => {
                setBannerUrl(e.target.value)
                setBannerFile(null)
              }}
            />
          </div>
          <div className="mt-2 rounded-2xl overflow-hidden border bg-gray-100 h-48">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                bannerUrl ||
                'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop'
              }
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          {serverErr?.toLowerCase().includes('banner') && (
            <div className="text-xs text-rose-600">{serverErr}</div>
          )}
        </section>

        {/* Temel bilgiler */}
        <section className="rounded-3xl border bg-white/70 backdrop-blur p-5 space-y-4 shadow-sm">
          <h2 className="text-base font-medium">Temel bilgiler</h2>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Kulüp adı *</label>
            <input
              type="text"
              className="w-full rounded-2xl border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (!name.trim()) setNameErr('Kulüp adı zorunlu.')
                else setNameErr(null)
              }}
              placeholder="Kulüp adı"
            />
            {nameErr && <div className="mt-1 text-xs text-rose-600">{nameErr}</div>}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Slug (otomatik)</label>
            <div className="rounded-2xl border px-3 py-2 bg-gray-50 text-gray-600">
              {computedSlug || <span className="italic">—</span>}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Slug kulüp adına göre otomatik güncellenir; düzenlenemez.
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Aylık ücret (₺)</label>
            <input
              type="number"
              min={0}
              step="1"
              className="w-40 rounded-2xl border px-3 py-2"
              value={priceTRY}
              onChange={(e) => setPriceTRY(e.target.value)}
              onBlur={() => {
                const money = moneyToNumber(priceTRY)
                if (Number.isNaN(money) || money < 0)
                  setPriceErr('Geçerli bir ücret girin (negatif olamaz).')
                else setPriceErr(null)
              }}
            />
            {priceErr && <div className="mt-1 text-xs text-rose-600">{priceErr}</div>}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Açıklama</label>
            <textarea
              className="w-full min-h-[120px] rounded-2xl border px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kısa açıklama…"
            />
          </div>
        </section>

        {/* Moderatör */}
        <section className="rounded-3xl border bg-white/70 backdrop-blur p-5 space-y-3 shadow-sm">
          <h2 className="text-base font-medium">Moderatör *</h2>
          <div className="relative">
            <input
              type="text"
              className="w-full rounded-2xl border px-3 py-2"
              placeholder="İsim ya da e-posta ile ara…"
              value={moderatorQuery}
              onChange={(e) => {
                setModeratorQuery(e.target.value)
                setOpenList(true)
              }}
              onFocus={() => setOpenList(true)}
              onBlur={() => {
                if (!moderator?.id) setModeratorErr('Moderatör seçin.')
                else setModeratorErr(null)
              }}
            />
            {openList && (
              <div className="absolute z-10 mt-1 w-full rounded-2xl border bg-white shadow max-h-64 overflow-auto">
                {searching && (
                  <div className="px-3 py-2 text-sm text-gray-600">Aranıyor…</div>
                )}
                {!searching && options.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-600">Sonuç yok.</div>
                )}
                {!searching &&
                  options.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      onClick={() => onPickModerator(u)}
                    >
                      <div className="text-sm font-medium">{u.name || 'İsimsiz'}</div>
                      <div className="text-xs text-gray-600">{u.email || 'e-posta yok'}</div>
                    </button>
                  ))}
              </div>
            )}
            {moderatorErr && (
              <div className="mt-1 text-xs text-rose-600">{moderatorErr}</div>
            )}
          </div>

          {moderator && (
            <div className="rounded-2xl border px-3 py-2 bg-white">
              <div className="text-sm font-medium">
                Seçilen: {moderator.name || 'İsimsiz'}
              </div>
              <div className="text-xs text-gray-600">{moderator.email || 'e-posta yok'}</div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModerator(null)
                    setModeratorQuery('')
                    setOpenList(false)
                    setModeratorErr('Moderatör seçin.')
                  }}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Kaldır
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Hata + Kaydet */}
        {serverErr && (
          <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
            {serverErr}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full px-5 py-2 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </form>

      {/* Programlar */}
      <section className="mt-10  rounded-3xl border bg-white/70 backdrop-blur p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Programlar</h2>
          <button
            type="button"
            onClick={() => {
              setEditingProgram(undefined)
              setModalMode('new')
              setModalOpen(true)
            }}
            className="rounded-full px-4 py-2 bg-gray-900 text-white hover:bg-black"
          >
            Program ekle
          </button>
        </div>

        {programs.length === 0 && (
          <div className="text-sm text-gray-600">Program yok.</div>
        )}

        <ul className="space-y-3">
          {programs.map((p) => (
            <li key={p.id} className="rounded-2xl border p-3 bg-white flex items-center gap-3">
              <div className="w-10 h-14 overflow-hidden rounded-md border bg-gray-100 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.book.coverUrl || '/placeholder.svg'}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{p.book.title || 'Seçki'}</div>
                <div className="text-xs text-gray-600">
                  {p.monthKey} {p.isCurrent ? '• (güncel)' : ''}
                </div>
                {p.note && <div className="text-xs text-gray-500 line-clamp-2">{p.note}</div>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full px-3 py-1.5 border"
                  onClick={() => {
                    setEditingProgram(p)
                    setModalMode('edit')
                    setModalOpen(true)
                  }}
                >
                  Düzenle
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ProgramModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        clubId={initialClub.id}
        program={editingProgram}
      />
    </>
  )
}
