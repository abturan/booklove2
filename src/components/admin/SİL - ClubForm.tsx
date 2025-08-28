// src/components/admin/ClubForm.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import ModeratorSearch from './ModeratorSearch'
import UploadInput from './UploadInput'
import ProgramEditor from './ProgramEditor'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/slugify'

type ClubFormProps = {
  mode: 'create' | 'edit'
  club?: {
    id: string
    name: string
    slug: string
    description: string
    bannerUrl: string
    moderator: { id: string; name: string; email: string } | null
  }
  programs?: Array<{
    id: string
    isCurrent: boolean
    note: string
    book: {
      id: string
      title: string
      author: string
      translator?: string
      pageCount?: number | null
      isbn?: string
      blurb?: string
      coverUrl?: string
    }
  }>
  latestStartsAt?: string
}

export default function ClubForm({
  mode,
  club,
  programs = [],
  latestStartsAt = '',
}: ClubFormProps) {
  const router = useRouter()
  const [name, setName] = useState(club?.name || '')
  const [bannerUrl, setBannerUrl] = useState(club?.bannerUrl || '')
  const [description, setDescription] = useState(club?.description || '')
  const [moderator, setModerator] = useState<
    { id: string; name: string; email: string } | null
  >(club?.moderator || null)

  const submitDisabled = useMemo(
    () => !name.trim() || !moderator,
    [name, moderator]
  )

  useEffect(() => {
    // yeni kulüp için ad değiştikçe slug göstermek istersen ileride ekranda kullanabilirsin
  }, [name])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitDisabled) return

    const payload = {
      name: name.trim(),
      slug: slugify(name.trim()),
      bannerUrl,
      description,
      moderatorId: moderator!.id,
    }

    const res = await fetch(
      mode === 'create'
        ? '/api/admin/clubs'
        : `/api/admin/clubs/${club!.id}`,
      {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    if (!res.ok) {
      alert('Kaydetme sırasında hata oluştu.')
      return
    }

    const data = await res.json()
    router.push(`/admin/clubs/${data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Kulüp adı</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400"
              placeholder="Örn. Sessiz Bahçe Okuma"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Moderatör</label>
            <ModeratorSearch value={moderator} onChange={setModerator} />
            <p className="text-xs text-gray-500 mt-1">
              Kullanıcı adıyla arayın ve seçin. Seçilen kullanıcı kulübün moderatörü olur.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Moderatör özgeçmiş / Kulüp açıklaması</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-400"
              placeholder="Kısa açıklama…"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Kulüp banner</label>
            <UploadInput
              folder="banners"
              value={bannerUrl}
              onChange={setBannerUrl}
              help="PNG/JPG önerilir. Ya dosya yükleyin ya da URL girin."
            />
          </div>
          {mode === 'edit' && (
            <div className="text-sm text-gray-500">
              Slug: <span className="font-mono">{club?.slug}</span>
            </div>
          )}
        </div>
      </div>

      <ProgramEditor
        clubId={club?.id || ''}
        initialPrograms={programs}
        initialStartsAt={latestStartsAt}
        editable={mode === 'edit'}
      />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitDisabled}
          className="rounded-xl bg-rose-600 text-white px-4 py-2.5 hover:bg-rose-700 disabled:opacity-60"
        >
          {mode === 'create' ? 'Kulübü oluştur' : 'Değişiklikleri kaydet'}
        </button>
      </div>
    </form>
  )
}
