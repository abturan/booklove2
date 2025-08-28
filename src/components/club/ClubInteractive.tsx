'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import ChatPanel from '@/components/ChatPanel'

type Initial = {
  me: { id: string | null; name: string | null; avatarUrl: string | null }
  club: {
    id: string
    slug: string
    name: string
    description: string | null
    bannerUrl: string
    priceTRY: number
    moderatorName: string
    memberCount: number
    isMember: boolean
    memberSince: string | null
    chatRoomId: string | null
    currentPick: { title: string; author: string; coverUrl: string } | null
    nextEvent: { title: string; startsAt: string } | null
    members: { id: string; name: string; avatarUrl: string }[]
  }
}

function formatDateTR(iso?: string | null) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

export default function ClubInteractive({ initial }: { initial: Initial }) {
  const [isMember, setIsMember] = useState(initial.club.isMember)
  const [memberSince, setMemberSince] = useState<string | null>(initial.club.memberSince)
  const [memberCount, setMemberCount] = useState(initial.club.memberCount)
  const [busy, setBusy] = useState(false)

  const onSubscribe = async () => {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/clubs/${initial.club.id}/subscribe`, { method: 'POST' })
      if (res.status === 401) {
        const cb = `/clubs/${initial.club.slug}#subscribe`
        window.location.href = `/login?callbackUrl=${encodeURIComponent(cb)}`
        return
      }
      if (!res.ok) throw new Error('Abonelik işlemi başarısız.')
      const nowIso = new Date().toISOString()
      setIsMember(true)
      setMemberSince(nowIso)
      setMemberCount((c) => c + 1)
    } catch (e) {
      alert('Abonelik sırasında bir sorun oluştu. Lütfen tekrar deneyin.')
    } finally {
      setBusy(false)
    }
  }

  const membersPreview = useMemo(() => initial.club.members.slice(0, 30), [initial.club.members])

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      {/* Sol içerik */}
      <div className="space-y-6">
        <div>
          <div className="text-sm text-gray-600">Moderatör</div>
          <h1 className="text-2xl md:text-3xl font-semibold">
            {initial.club.moderatorName} — {initial.club.name}
          </h1>
          <p className="mt-2 text-gray-700">{initial.club.description}</p>
        </div>

        {/* Üyeler bulutu */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Üyeler</div>
            <div className="text-sm text-gray-600">Toplam: {memberCount}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            {membersPreview.map((m) => (
              <div key={m.id} className="relative group">
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow">
                  <Image src={m.avatarUrl} alt={m.name} width={36} height={36} />
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -top-8 pointer-events-none opacity-0 group-hover:opacity-100 transition text-xs bg-gray-900 text-white px-2 py-1 rounded-xl whitespace-nowrap">
                  {m.name}
                </div>
              </div>
            ))}
            {memberCount > membersPreview.length && (
              <span className="text-xs text-gray-600">
                +{memberCount - membersPreview.length} daha
              </span>
            )}
          </div>
        </div>

        {/* Seçki - Etkinlik */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-4">
            <div className="text-sm text-gray-600">Bu ayın seçkisi</div>
            {initial.club.currentPick ? (
              <div className="mt-2 flex items-center gap-3">
                <div className="relative w-12 h-16 rounded overflow-hidden bg-gray-100">
                  <Image
                    src={initial.club.currentPick.coverUrl}
                    alt={initial.club.currentPick.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium">{initial.club.currentPick.title}</div>
                  <div className="text-sm text-gray-600">{initial.club.currentPick.author}</div>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-gray-600 text-sm">Kayıt yok</div>
            )}
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-600">Yaklaşan oturum</div>
            {initial.club.nextEvent ? (
              <div className="mt-2">
                {formatDateTR(initial.club.nextEvent.startsAt)}
              </div>
            ) : (
              <div className="mt-2 text-gray-600 text-sm">Planlanmadı</div>
            )}
            <div className="mt-2 text-sm text-gray-600">Üye sayısı: {memberCount}</div>
          </div>
        </div>

        {/* Sohbet */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 pt-4">
            <div className="font-medium">Sohbet</div>
          </div>
          <div className="p-4 pt-2">
            <ChatPanel enabled={isMember} clubId={initial.club.id} />
          </div>
          {!isMember && (
            <div className="px-4 pb-4 text-xs text-gray-600">
              Yalnızca aboneler mesaj görebilir ve yazabilir. Birini <code>@isim</code> ile etiketlediğinde bildirim oluşturulur.
            </div>
          )}
        </div>
      </div>

      {/* Sağ – Abonelik kutusu */}
      <aside className="space-y-4">
        <div className="card p-4">
          <div className="text-sm text-gray-600">Abonelik</div>
          <div className="text-3xl font-semibold">₺{initial.club.priceTRY}</div>

          {!isMember ? (
            <button
              onClick={onSubscribe}
              disabled={busy}
              className="mt-4 w-full rounded-full h-11 bg-rose-600 text-white font-medium hover:bg-rose-700 transition disabled:opacity-60"
            >
              {busy ? 'Abone olunuyor…' : `Abone ol (₺${initial.club.priceTRY})`}
            </button>
          ) : (
            <div className="mt-4 rounded-2xl bg-emerald-50 text-emerald-900 p-4 text-sm">
              <div className="font-medium mb-1">Abonesiniz</div>
              {memberSince && (
                <div>Şu tarihten beri: {formatDateTR(memberSince)}</div>
              )}
            </div>
          )}
        </div>

        <div className="card p-4">
          <div className="text-sm text-gray-600">Kulüp bilgileri</div>
          <div className="mt-2 text-sm">
            Moderatör: <span className="font-medium">{initial.club.moderatorName}</span>
          </div>
          <div className="text-sm">Üye sayısı: <span className="font-medium">{memberCount}</span></div>
        </div>
      </aside>
    </div>
  )
}
