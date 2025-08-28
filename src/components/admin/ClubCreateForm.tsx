'use client'

import * as React from 'react'
import Image from 'next/image'

type UserLite = { id: string; name: string | null; email: string; role: string }

export default function ClubCreateForm() {
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
        if (!res.ok) throw new Error('Kullanıcı aranamadı')
        const data = (await res.json()) as { users: UserLite[] }
        setModResults(data.users || [])
      } catch {
        // yut
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
    // admin upload route avatarları bozmasın diye folder paramı
    fd.append('folder', 'banners')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Yükleme hatası')
    return data.url as string
  }

  async function uploadCover(f: File) {
    const fd = new FormData()
    fd.append('file', f)
    fd.append('folder', 'covers')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Yükleme hatası')
    return data.url as string
  }

  // --- Kulüp oluştur
  async function handleCreateClub() {
    if (!canCreate) return
    setCreating(true)
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
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Kulüp oluşturulamadı')
      setCreatedClub({ id: data.id, slug: data.slug })
    } catch (e: any) {
      alert(e?.message || 'Hata')
    } finally {
      setCreating(false)
    }
  }

  // --- Program kaydet
  async function handleSaveProgram() {
    if (!createdClub) return
    setSavingProgram(true)
    try {
      const res = await fetch(`/api/admin/clubs/${createdClub.id}/program`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventAt,
          book: {
            title: bookTitle,
            author: bookAuthor,
            translator: bookTranslator || null,
            pages: bookPages ? Number(bookPages) : null,
            isbn: bookIsbn || null,
            description: bookDesc || null,
            coverUrl: bookCoverUrl,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Program kaydedilemedi')
      alert('Program kaydedildi')
    } catch (e: any) {
      alert(e?.message || 'Hata')
    } finally {
      setSavingProgram(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Üst kart: Kulüp bilgileri + OLUŞTUR butonu (kartın içinde!) */}
      <div className="card p-6 space-y-4">
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
          <div className="flex md:justify-end">
            <button
              onClick={handleCreateClub}
              disabled={!canCreate}
              className={`px-5 h-10 rounded-full text-white transition ${
                canCreate ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gray-300 cursor-not-allowed'
              }`}
              title={!canCreate ? 'Kulüp adı ve moderatör gerekli' : 'Kulübü oluştur'}
            >
              {creating ? 'Oluşturuluyor…' : 'Kulübü oluştur'}
            </button>
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
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow">
                    {searching && (
                      <div className="px-3 py-2 text-sm text-gray-500">Aranıyor…</div>
                    )}
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
                <button
                  type="button"
                  onClick={() => setModSelected(null)}
                  className="text-sm text-rose-600 hover:underline"
                >
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
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    try {
                      const url = await uploadBanner(f)
                      setBannerUrl(url)
                    } catch (err: any) {
                      alert(err?.message || 'Yükleme hatası')
                    }
                  }}
                />
                <span className="px-4 h-9 inline-flex items-center rounded-full bg-gray-900 text-white cursor-pointer">
                  Dosya Seç
                </span>
              </label>
              {bannerUrl && (
                <span className="text-sm text-gray-600 truncate max-w-[220px]">{bannerUrl}</span>
              )}
            </div>
            {bannerUrl && (
              <div className="relative mt-3 h-24 rounded-xl overflow-hidden">
                <Image src={bannerUrl} alt="banner" fill className="object-cover" />
              </div>
            )}
          </div>
        </div>

        {!createdClub && (
          <p className="text-sm text-gray-600">
            <strong>Not:</strong> Önce kulübü oluşturun. Ardından aylık programı ekleyebileceksiniz.
          </p>
        )}
      </div>

      {/* Program alanı */}
      <div className={`card p-6 space-y-4 ${!createdClub ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Aylık Program</h2>
          {createdClub && (
            <span className="text-sm text-gray-600">
              Kulüp oluşturuldu: <code>{createdClub.slug}</code>
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Oturum tarihi & saati</label>
            <input
              type="datetime-local"
              value={eventAt}
              onChange={(e) => setEventAt(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Kapak yükle</label>
            <div className="flex items-center gap-3">
              <label className="inline-block">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    try {
                      const url = await uploadCover(f)
                      setBookCoverUrl(url)
                    } catch (err: any) {
                      alert(err?.message || 'Yükleme hatası')
                    }
                  }}
                />
                <span className="px-4 h-9 inline-flex items-center rounded-full bg-gray-900 text-white cursor-pointer">
                  Dosya Seç
                </span>
              </label>
              {bookCoverUrl && (
                <span className="text-sm text-gray-600 truncate max-w-[260px]">{bookCoverUrl}</span>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Kitap adı</label>
            <input
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Yazar</label>
            <input
              value={bookAuthor}
              onChange={(e) => setBookAuthor(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Çevirmen</label>
            <input
              value={bookTranslator}
              onChange={(e) => setBookTranslator(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Sayfa sayısı</label>
            <input
              inputMode="numeric"
              value={bookPages}
              onChange={(e) => setBookPages(e.target.value.replace(/[^\d]/g, ''))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">ISBN</label>
            <input
              value={bookIsbn}
              onChange={(e) => setBookIsbn(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm text-gray-600 mb-1">Açıklama</label>
            <textarea
              value={bookDesc}
              onChange={(e) => setBookDesc(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveProgram}
            disabled={
              !createdClub ||
              !eventAt ||
              !bookTitle.trim() ||
              !bookAuthor.trim() ||
              savingProgram
            }
            className={`px-5 h-10 rounded-full text-white transition ${
              !createdClub || !eventAt || !bookTitle.trim() || !bookAuthor.trim() || savingProgram
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gray-900 hover:bg-black'
            }`}
          >
            {savingProgram ? 'Kaydediliyor…' : 'Programı Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
