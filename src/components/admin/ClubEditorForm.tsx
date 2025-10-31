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
  capacity?: number | null
}

export default function ClubEditorForm({
  initialClub,
}: {
  initialClub: InitialClub
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

  const [name, setName] = React.useState(initialClub.name ?? '')
  const [computedSlug, setComputedSlug] = React.useState(
    initialClub.slug || slugifyTr(initialClub.name || '')
  )
  const [priceTRY, setPriceTRY] = React.useState(String(initialClub.priceTRY ?? 0))
  const [description, setDescription] = React.useState(initialClub.description ?? '')
  const [bannerUrl, setBannerUrl] = React.useState(initialClub.bannerUrl ?? '')
  const [bannerFile, setBannerFile] = React.useState<File | null>(null)

  const [capacity, setCapacity] = React.useState<string>(
    typeof initialClub.capacity === 'number' && initialClub.capacity >= 0
      ? String(initialClub.capacity)
      : ''
  )

  const [saving, setSaving] = React.useState(false)
  const [nameErr, setNameErr] = React.useState<string | null>(null)
  const [priceErr, setPriceErr] = React.useState<string | null>(null)
  const [capacityErr, setCapacityErr] = React.useState<string | null>(null)
  const [moderatorErr, setModeratorErr] = React.useState<string | null>(null)
  const [serverErr, setServerErr] = React.useState<string | null>(null)

  const [moderatorQuery, setModeratorQuery] = React.useState(
    initialClub.moderator ? `${initialClub.moderator.name}` : ''
  )
  const [moderator, setModerator] = React.useState<ModeratorLite | null>(
    initialClub.moderator
  )
  const [options, setOptions] = React.useState<ModeratorLite[]>([])
  const [openList, setOpenList] = React.useState(false)
  const [searching, setSearching] = React.useState(false)

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

    if (capacity.trim() !== '') {
      const n = Number(capacity)
      if (!Number.isInteger(n) || n < 0) {
        setCapacityErr('Abone limiti 0 veya pozitif tam sayı olmalı (boş = sınırsız).')
        ok = false
      } else setCapacityErr(null)
    } else {
      setCapacityErr(null)
    }

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
          capacity: capacity.trim() === '' ? null : Number(capacity),
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

  return (
    <>
      <form onSubmit={submitClub} className="space-y-8">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Aylık ücret (₺)</label>
              <input
                type="number"
                min={0}
                step="1"
                className="w-full md:w-40 rounded-2xl border px-3 py-2"
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
              <label className="block text-sm text-gray-600 mb-1">Abone limiti (opsiyonel)</label>
              <input
                type="number"
                min={0}
                step="1"
                className="w-full md:w-40 rounded-2xl border px-3 py-2"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                onBlur={() => {
                  if (capacity.trim() === '') { setCapacityErr(null); return }
                  const n = Number(capacity)
                  if (!Number.isInteger(n) || n < 0)
                    setCapacityErr('0 veya pozitif tam sayı girin (boş = sınırsız).')
                  else setCapacityErr(null)
                }}
                placeholder="Boş bırak: sınırsız"
              />
              {capacityErr && <div className="mt-1 text-xs text-rose-600">{capacityErr}</div>}
            </div>
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

    </>
  )
}
