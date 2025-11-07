'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'

type UserLite = { id: string; name: string | null; email: string; role: string }

// basit toast altyapısı (harici paket gerekmez)
type Toast = { id: number; kind: 'success' | 'error' | 'info'; text: string }
function useToasts() {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const push = React.useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, ...t }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id))
      }, 3500)
    },
    [setToasts]
  )
  return { toasts, push }
}

async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) return null
  try { return await res.json() } catch { return null }
}

// datetime-local -> ISO (UTC) dönüştür
function toISOZ(datetimeLocal: string) {
  if (!datetimeLocal) return ''
  const d = new Date(datetimeLocal)
  const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString()
  return iso
}

export default function ClubCreateForm() {
  // Toastlar
  const { toasts, push } = useToasts()

  // --- Kulüp oluşturma durumları
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [bannerUrl, setBannerUrl] = React.useState<string | null>(null)

  // Moderatör seçimi
  const [modQuery, setModQuery] = React.useState('')
  const [modResults, setModResults] = React.useState<UserLite[]>([])
  const [modSelected, setModSelected] = React.useState<UserLite | null>(null)
  const [searching, setSearching] = React.useState(false)

  // Oluşturma
  const [creating, setCreating] = React.useState(false)
  const [createErr, setCreateErr] = React.useState<string | null>(null)
  const [createdClub, setCreatedClub] = React.useState<{ id: string; slug: string } | null>(null)
  const canCreate = name.trim().length >= 3 && !!modSelected && !creating

  // Program alanları (kulüp oluşturulduktan sonra aktif)
  const [eventAt, setEventAt] = React.useState<string>('') // datetime-local
  const [bookTitle, setBookTitle] = React.useState('')
  const [bookAuthor, setBookAuthor] = React.useState('')
  const [bookTranslator, setBookTranslator] = React.useState('')
  const [bookPages, setBookPages] = React.useState<string>('')
  const [bookIsbn, setBookIsbn] = React.useState('')
  const [bookDesc, setBookDesc] = React.useState('')
  const [bookCoverUrl, setBookCoverUrl] = React.useState<string | null>(null)
  const [savingProgram, setSavingProgram] = React.useState(false)
  const [programErr, setProgramErr] = React.useState<string | null>(null)

  // --- Moderatör arama (debounce)
  React.useEffect(() => {
    if (!modQuery || modSelected) {
      setModResults([])
      return
    }
    const ac = new AbortController()
    const t = setTimeout(async () => {
      try {
        setSearching(true)
        const res = await fetch(`/api/admin/users?q=${encodeURIComponent(modQuery)}`, {
          signal: ac.signal,
        })
        const data = await safeJson(res)
        if (!res.ok) throw new Error(data?.error || 'Kullanıcı aranamadı')
        setModResults((data?.users as UserLite[]) || [])
      } catch {
        // sessiz
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => {
      clearTimeout(t)
      ac.abort()
    }
  }, [modQuery, modSelected])

  // --- Upload helpers
  async function uploadBanner(f: File) {
    const fd = new FormData()
    fd.append('file', f)
    fd.append('folder', 'banners')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Yükleme hatası')
    return data!.url as string
  }

  async function uploadCover(f: File) {
    const fd = new FormData()
    fd.append('file', f)
    fd.append('folder', 'covers')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Yükleme hatası')
    return data!.url as string
  }

  // --- Kulüp oluştur
  async function handleCreateClub() {
    if (!canCreate) return
    setCreating(true)
    setCreateErr(null)
    try {
      const res = await fetch('/api/admin/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          moderatorId: modSelected!.id,
          bannerUrl,
        }),
      })
      const data = await safeJson(res)
      if (!res.ok) {
        const msg =
          data?.error ||
          (res.status === 409
            ? 'Bu moderatör zaten bir kulüp yönetiyor. Lütfen başka bir moderatör seçin.'
            : 'Kulüp oluşturulamadı')
        setCreateErr(msg)
        push({ kind: 'error', text: msg })
        return
      }
      setCreatedClub({ id: data!.id, slug: data!.slug })
      push({ kind: 'success', text: 'Kulüp kaydedildi.' })
    } catch (e: any) {
      const msg = e?.message || 'Kulüp oluşturulamadı'
      setCreateErr(msg)
      push({ kind: 'error', text: msg })
    } finally {
      setCreating(false)
    }
  }

  // --- Program kaydet
  async function handleSaveProgram() {
    if (!createdClub) return
    setSavingProgram(true)
    setProgramErr(null)
    try {
      const res = await fetch(`/api/admin/clubs/${createdClub.id}/program`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startsAt: toISOZ(eventAt),
          book: {
            title: bookTitle.trim(),
            author: bookAuthor.trim(),
            translator: bookTranslator || null,
            pages: bookPages ? Number(bookPages) : null,
            isbn: bookIsbn || null,
            backText: bookDesc || null, // not alanına mapleniyor backend’de
            coverUrl: bookCoverUrl,
          },
          note: bookDesc || null,
        }),
      })
      const data = await safeJson(res)
      if (!res.ok) {
        const msg = data?.error || 'Program kaydedilemedi'
        setProgramErr(msg)
        push({ kind: 'error', text: msg })
        return
      }
      push({ kind: 'success', text: 'Aylık program kaydedildi.' })
    } catch (e: any) {
      const msg = e?.message || 'Program kaydedilemedi'
      setProgramErr(msg)
      push({ kind: 'error', text: msg })
    } finally {
      setSavingProgram(false)
    }
  }

  return (
    <>
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={
              'rounded-xl px-4 py-2 shadow text-sm ' +
              (t.kind === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : t.kind === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-gray-50 text-gray-700 border border-gray-200')
            }
          >
            {t.text}
          </div>
        ))}
      </div>

      <div className="space-y-8" aria-live="polite">
        {/* Üst kart: Kulüp bilgileri */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-semibold">Kulüp bilgileri</h2>
            <button
              onClick={handleCreateClub}
              disabled={!canCreate}
              className={`px-5 h-10 rounded-full text-white transition inline-flex items-center gap-2 ${
                canCreate ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gray-300 cursor-not-allowed'
              }`}
              title={!canCreate ? 'Kulüp adı ve moderatör gerekli' : 'Kulübü oluştur'}
            >
              {creating && (
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
              )}
              {creating ? 'Oluşturuluyor…' : 'Kulübü oluştur'}
            </button>
          </div>

          {createErr && (
            <div role="alert" className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
              {createErr}
            </div>
          )}

          {createdClub && (
            <div role="status" className="rounded-xl bg-green-50 border border-green-200 text-green-800 px-3 py-2 text-sm">
              Kulüp kaydedildi. Slug: <code className="font-mono">{createdClub.slug}</code>{' '}
              —{' '}
              <Link className="underline font-medium" href={`/admin/clubs/${createdClub.id}/edit`}>
                düzenlemeye git
              </Link>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Kulüp adı</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Kırmızı Pencere Kulübü"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Moderatör seç</label>
              {!modSelected ? (
                <div className="relative">
                  <input
                    value={modQuery}
                    onChange={(e) => setModQuery(e.target.value)}
                    placeholder="İsim veya e-posta yaz"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  {modQuery && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow max-h-64 overflow-auto">
                      {searching && <div className="px-3 py-2 text-sm text-gray-500">Aranıyor…</div>}
                      {!searching && modResults.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">Sonuç yok</div>
                      )}
                      {!searching &&
                        modResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setModSelected(u)
                              setModQuery('')
                              setModResults([])
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          >
                            <div className="font-medium">{u.name || '(İsimsiz)'}</div>
                            <div className="text-xs text-gray-600">{u.email}</div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900 text-white">
                    {modSelected.name || '(İsimsiz)'}
                  </span>
                  <button type="button" onClick={() => setModSelected(null)} className="text-sm text-rose-600 hover:underline">
                    Değiştir
                  </button>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Açıklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kulüp hakkında kısa açıklama…"
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Banner görseli</label>
              <div className="flex items-center gap-3">
                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      try {
                        const url = await uploadBanner(f)
                        setBannerUrl(url)
                        push({ kind: 'success', text: 'Banner yüklendi.' })
                      } catch (err: any) {
                        const msg = err?.message || 'Yükleme hatası'
                        push({ kind: 'error', text: msg })
                      }
                    }}
                  />
                  <span className="inline-flex items-center justify-center px-4 h-9 rounded-full bg-gray-900 text-white cursor-pointer whitespace-nowrap min-w-[110px]">
                    Dosya Seç
                  </span>
                </label>
                {bannerUrl && <span className="text-sm text-gray-600 truncate max-w-[220px]">{bannerUrl}</span>}
              </div>
              {bannerUrl && (
                <div className="relative mt-3 h-24 rounded-xl overflow-hidden">
                  <Image src={bannerUrl} alt="banner" fill className="object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Program alanı */}
        
      </div>
    </>
  )
}
