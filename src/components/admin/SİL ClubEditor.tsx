'use client'

import { useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import ModeratorPicker from './ModeratorPicker'
import { useRouter } from 'next/navigation'

type ClubEditorProps = {
  initialClub: {
    id: string
    name: string
    description: string
    bannerUrl: string
    priceTRY: number
    moderator: { id: string; name: string; email: string } | null
    picks: Array<{
      id: string
      monthKey: string
      isCurrent: boolean
      note: string
      book: { id: string; title: string; author: string; coverUrl: string }
    }>
    lastEvent: { id: string; startsAt: string; title: string } | null
  }
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default function ClubEditor({ initialClub }: ClubEditorProps) {
  const router = useRouter()
  const [isSaving, startSave] = useTransition()
  const [isAddingProgram, startAdd] = useTransition()

  // --- Kulüp bilgileri
  const [name, setName] = useState(initialClub.name)
  const [description, setDescription] = useState(initialClub.description)
  const [bannerUrl, setBannerUrl] = useState(initialClub.bannerUrl)
  const [priceTRY, setPriceTRY] = useState<number>(initialClub.priceTRY || 0)
  const [moderator, setModerator] = useState(initialClub.moderator)

  // --- Program formu
  const [evDate, setEvDate] = useState<string>('') // datetime-local
  const [coverUrl, setCoverUrl] = useState<string>('')
  const [bookTitle, setBookTitle] = useState<string>('')
  const [bookAuthor, setBookAuthor] = useState<string>('')
  const [bookTranslator, setBookTranslator] = useState<string>('')
  const [bookPages, setBookPages] = useState<string>('')
  const [bookIsbn, setBookIsbn] = useState<string>('')
  const [programNote, setProgramNote] = useState<string>('')

  const saveDisabled = useMemo(
    () => !name.trim() || !moderator?.id,
    [name, moderator]
  )

  async function uploadBanner(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'banner') // mevcut /api/upload ile uyumlu

    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Yükleme hatası')
    setBannerUrl(data.url)
  }

  async function onSave() {
    startSave(async () => {
      try {
        const res = await fetch(`/api/admin/clubs/${initialClub.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            slug: slugify(name.trim()),
            description,
            bannerUrl,
            priceTRY: Number(priceTRY) || 0,
            moderatorId: moderator?.id || null,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Kaydetme başarısız')
        alert('Kulüp bilgileri güncellendi.')
        router.refresh()
      } catch (e: any) {
        alert(e.message || 'Hata oluştu')
      }
    })
  }

  async function uploadCover(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'bookCover')

    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Yükleme hatası')
    setCoverUrl(data.url)
  }

  async function onAddProgram() {
    startAdd(async () => {
      try {
        if (!evDate || !bookTitle.trim()) {
          alert('Oturum tarihi ve kitap adı zorunlu.')
          return
        }
        const res = await fetch(`/api/admin/clubs/${initialClub.id}/program`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startsAt: new Date(evDate).toISOString(),
            book: {
              title: bookTitle.trim(),
              author: bookAuthor.trim(),
              translator: bookTranslator.trim() || null,
              pages: bookPages ? Number(bookPages) : null,
              isbn: bookIsbn.trim() || null,
              coverUrl: coverUrl || null,
              description: programNote || null,
            },
            note: programNote || '',
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Program eklenemedi')
        alert('Yeni program eklendi (bu ayın seçkisi yapıldı).')
        // formu sıfırla
        setEvDate('')
        setCoverUrl('')
        setBookTitle('')
        setBookAuthor('')
        setBookTranslator('')
        setBookPages('')
        setBookIsbn('')
        setProgramNote('')
        router.refresh()
      } catch (e: any) {
        alert(e.message || 'Hata oluştu')
      }
    })
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* SOL: Kulüp bilgileri */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card p-4 space-y-4">
          <div className="relative h-40 rounded-xl overflow-hidden bg-gray-100">
            {bannerUrl ? (
              <Image src={bannerUrl} alt="" fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-gray-500 text-sm">
                Banner yok
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) uploadBanner(f).catch((err) => alert(err.message))
              }}
            />
            {bannerUrl && (
              <span className="text-xs text-gray-600 break-all">{bannerUrl}</span>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kulüp adı</label>
              <input
                className="form-input w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kulüp adı"
              />
              <div className="text-xs text-gray-500 mt-1">Slug: {slugify(name)}</div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Aylık ücret (₺)</label>
              <input
                className="form-input w-full"
                type="number"
                inputMode="numeric"
                value={String(priceTRY)}
                onChange={(e) => setPriceTRY(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Açıklama</label>
            <textarea
              className="form-textarea w-full"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kulüp hakkında kısa açıklama…"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Moderatör</label>
            <ModeratorPicker
              initial={moderator || undefined}
              onSelect={(u) => setModerator(u)}
            />
          </div>

          <div className="pt-2">
            <button
              disabled={saveDisabled || isSaving}
              onClick={onSave}
              className={`px-4 py-2 rounded-full text-white ${saveDisabled ? 'bg-gray-400' : 'bg-gray-900'}`}
            >
              {isSaving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </div>

        {/* Mevcut program(lar) listesi sadece bilgi amaçlı */}
        <div className="card p-4">
          <h3 className="font-medium mb-3">Mevcut program(lar)</h3>
          <div className="space-y-3">
            {initialClub.picks.length ? (
              initialClub.picks.map((p) => (
                <div key={p.id} className="rounded-xl border p-3">
                  <div className="text-sm text-gray-600">
                    Ay: {p.monthKey} {p.isCurrent && '(güncel)'}
                  </div>
                  <div className="font-medium">{p.book.title}</div>
                  <div className="text-sm text-gray-600">{p.book.author}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-600">Program yok.</div>
            )}
          </div>
        </div>
      </div>

      {/* SAĞ: Yeni program ekle */}
      <div className="space-y-6">
        <div className="card p-4 space-y-3">
          <h3 className="font-medium mb-1">Yeni program ekle</h3>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Oturum tarihi & saati
            </label>
            <input
              type="datetime-local"
              className="form-input w-full"
              value={evDate}
              onChange={(e) => setEvDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kapak yükle</label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) uploadCover(f).catch((err) => alert(err.message))
                }}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">veya Kapak URL</label>
              <input
                className="form-input w-full"
                placeholder="https://…"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kitap adı</label>
              <input
                className="form-input w-full"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Yazar</label>
              <input
                className="form-input w-full"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Çevirmen</label>
              <input
                className="form-input w-full"
                value={bookTranslator}
                onChange={(e) => setBookTranslator(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Sayfa sayısı</label>
              <input
                className="form-input w-full"
                inputMode="numeric"
                value={bookPages}
                onChange={(e) => setBookPages(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">ISBN</label>
            <input
              className="form-input w-full"
              value={bookIsbn}
              onChange={(e) => setBookIsbn(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Açıklama / Not</label>
            <textarea
              className="form-textarea w-full"
              rows={4}
              value={programNote}
              onChange={(e) => setProgramNote(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              onClick={onAddProgram}
              disabled={isAddingProgram}
              className="px-4 py-2 rounded-full bg-gray-900 text-white disabled:opacity-60"
            >
              {isAddingProgram ? 'Kaydediliyor…' : 'Programı ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
