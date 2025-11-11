// src/components/admin/EventParticipantsModal.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/modal'
import Avatar from '@/components/Avatar'
import Link from 'next/link'

type Participant = {
  userId: string
  name: string | null
  username: string | null
  email: string | null
  avatarUrl: string | null
  slug: string | null
  registeredAt?: string | null
  paymentAmount?: number | null
  sources: Array<{ type: 'membership' | 'subscription' | 'moderator'; id: string; joinedAt?: string | null; startedAt?: string | null; role?: string | null }>
}

type MailRecipient = {
  id: string
  userId: string | null
  email: string
  name: string | null
  status: string
  sentAt: string | null
  error: string | null
}

type MailHistory = {
  id: string
  subject: string
  note: string | null
  previewText: string | null
  sendScope: string
  createdAt: string
  createdBy?: { id: string; name: string | null; email: string | null } | null
  recipients: MailRecipient[]
}

type EventResponse = {
  event: {
    id: string
    title: string
    startsAt: string
    club: { id: string; name: string; slug: string }
    moderator: { id: string; name: string | null; email: string | null } | null
    stats: { total: number; membershipCount: number; subscriptionCount: number }
  }
  participants: Participant[]
  mailHistory: MailHistory[]
}

type Props = {
  eventId: string
  eventTitle: string
  startsAt: string
  clubSlug: string
  open: boolean
  onClose: () => void
}

export default function EventParticipantsModal({ eventId, eventTitle, startsAt, clubSlug, open, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<EventResponse | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [composerOpen, setComposerOpen] = useState(false)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [expandedMail, setExpandedMail] = useState<string | null>(null)
  const [selectedMailId, setSelectedMailId] = useState<string>('')
  const [extraEmailsText, setExtraEmailsText] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<Array<{ id: string; name: string | null; email: string | null }>>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [addBusyId, setAddBusyId] = useState<string | null>(null)
  const [removeBusyId, setRemoveBusyId] = useState<string | null>(null)

  const pillButton = 'rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100'
  const subtleButton = 'rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-40'
  const primaryButton = 'rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40'

  useEffect(() => {
    if (!open) return
    void loadData()
  }, [open, eventId])

  useEffect(() => {
    if (!open) return
    const q = userSearch.trim()
    if (q.length < 2) {
      setUserResults([])
      setSearchingUsers(false)
      return
    }
    setSearchingUsers(true)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`, { cache: 'no-store', signal: controller.signal })
        const json = await res.json().catch(() => ({}))
        if (!controller.signal.aborted) {
          setUserResults(Array.isArray(json?.items) ? json.items : [])
        }
      } catch {
        if (!controller.signal.aborted) setUserResults([])
      } finally {
        if (!controller.signal.aborted) setSearchingUsers(false)
      }
    }, 250)
    return () => {
      controller.abort()
      clearTimeout(timer)
      setSearchingUsers(false)
    }
  }, [userSearch, open])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/admin/events/${eventId}/participants`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Veriler alınamadı')
      const json = (await res.json()) as EventResponse
      setData(json)
      setSelectedMailId((prev) => {
        if (prev && json.mailHistory.some((mail) => mail.id === prev)) {
          return prev
        }
        return latestMailId(json.mailHistory)
      })
    } catch (err: any) {
      setError(err?.message || 'Veriler alınamadı')
    } finally {
      setLoading(false)
    }
  }

  function toggleSelection(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  function selectAll() {
    if (!data) return
    setSelectedIds(new Set(data.participants.map((p) => p.userId)))
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function downloadCsv() {
    if (!data) return
    const docNumber = Math.floor(Date.now() / 1000)
    const totalParticipants = data.participants.length
    const statsText = `Toplam ${totalParticipants} kayıt · Üyelik ${data.event.stats.membershipCount} · Abonelik ${data.event.stats.subscriptionCount}`
    const reportMeta = [
      ['Book.love Etkinlik Raporu'],
      ['Kulüp', data.event.club.name],
      ['Etkinlik', data.event.title],
      ['Etkinlik Tarihi', formatDateTime(data.event.startsAt)],
      ['Etkinlik İstatistikleri', statsText],
      ['Katılımcı Sayısı', String(totalParticipants)],
      ['Moderatör', data.event.moderator?.name || '—'],
      ['Doküman No', String(docNumber)],
      [''],
    ]

    const headers = ['İsim', 'Kullanıcı adı', 'E-posta', 'Kayıt tarihi', 'Fiyat']
    const rows = data.participants.map((p) => [
      safeCsv(p.name || ''),
      safeCsv(p.username || ''),
      safeCsv(p.email || ''),
      safeCsv(p.registeredAt ? formatDate(p.registeredAt) : ''),
      safeCsv(typeof p.paymentAmount === 'number' ? formatCurrency(p.paymentAmount) : ''),
    ])

    const csvLines = [
      ...reportMeta.map((row) => row.map(safeCsv).join(',')),
      headers.map(safeCsv).join(','),
      ...rows.map((row) => row.join(',')),
    ]

    const csv = csvLines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `event-${eventId}-participants.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function handleAddParticipant(userId: string) {
    if (!userId) return
    try {
      setAddBusyId(userId)
      setMessage(null)
      const res = await fetch(`/api/admin/events/${eventId}/participants`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Katılımcı eklenemedi')
      setMessage(json?.activated ? 'Katılımcı listeye eklendi.' : 'Kullanıcı zaten listede.')
      setUserSearch('')
      setUserResults([])
      await loadData()
    } catch (err: any) {
      setMessage(err?.message || 'Katılımcı eklenemedi')
    } finally {
      setAddBusyId(null)
    }
  }

  async function handleRemoveParticipant(userId: string) {
    if (!userId) return
    try {
      setRemoveBusyId(userId)
      setMessage(null)
      const res = await fetch(`/api/admin/events/${eventId}/participants`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Katılımcı çıkarılamadı')
      setMessage('Katılımcı listeden çıkarıldı.')
      await loadData()
    } catch (err: any) {
      setMessage(err?.message || 'Katılımcı çıkarılamadı')
    } finally {
      setRemoveBusyId(null)
    }
  }

  async function handleSaveMail() {
    try {
      setSaving(true)
      setMessage(null)
      const res = await fetch(`/api/admin/events/${eventId}/mail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, saveOnly: true }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Mail kaydedilemedi')
      }
      const json = await res.json()
      const newMailId: string | undefined = json?.mail?.id
      setMessage('Mail taslağı kaydedildi.')
      setComposerOpen(false)
      setNote('')
      await loadData()
      if (newMailId) {
        setSelectedMailId(newMailId)
      }
    } catch (err: any) {
      setMessage(err?.message || 'Mail kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  function assertSelectedMail(): string | null {
    if (!selectedMailId) {
      setMessage('Lütfen göndermek için bir mail taslağı seçin.')
      return null
    }
    return selectedMailId
  }

  function getValidExtraEmails(): string[] | null {
    if (extraEmailInvalid.length > 0) {
      setMessage(`Geçersiz e-posta adresleri: ${extraEmailInvalid.join(', ')}`)
      return null
    }
    return extraEmailInfo.valid
  }

  async function sendMailToAll() {
    const mailId = assertSelectedMail()
    if (!mailId) return
    const extras = getValidExtraEmails()
    if (extras === null) return
    await handleResend(mailId, undefined, extras)
  }

  async function sendMailToSelected() {
    if (selectedIds.size === 0) {
      setMessage('Lütfen en az bir katılımcı seçin.')
      return
    }
    const mailId = assertSelectedMail()
    if (!mailId) return
    const extras = getValidExtraEmails()
    if (extras === null) return
    await handleResend(mailId, Array.from(selectedIds), extras)
  }

  async function sendMailToSingle(userId: string | undefined) {
    if (!userId) {
      setMessage('Geçersiz kullanıcı.')
      return
    }
    const mailId = assertSelectedMail()
    if (!mailId) return
    const extras = getValidExtraEmails()
    if (extras === null) return
    await handleResend(mailId, [userId], extras)
  }

  async function handleResend(mailId: string, recipientIds?: string[], extraEmails?: string[]) {
    try {
      setMessage(null)
      setSending(true)
      const payload: Record<string, any> = {}
      if (recipientIds && recipientIds.length > 0) payload.recipientIds = recipientIds
      if (extraEmails && extraEmails.length > 0) payload.extraEmails = extraEmails
      const res = await fetch(`/api/admin/events/mail/${mailId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Mail gönderilemedi')
      }
      setMessage('Mail gönderimi başlatıldı.')
      await loadData()
    } catch (err: any) {
      setMessage(err?.message || 'Mail gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  const selectedMail = useMemo(() => {
    if (!data) return null
    return data.mailHistory.find((mail) => mail.id === selectedMailId) || null
  }, [data, selectedMailId])

  const extraEmailInfo = useMemo(() => parseEmailList(extraEmailsText), [extraEmailsText])
  const extraEmailCount = extraEmailInfo.valid.length
  const extraEmailInvalid = extraEmailInfo.invalid

  const statusMap = useMemo(() => {
    const map = new Map<string, { status: string; mailId: string }>()
    if (!data) return map
    data.mailHistory.forEach((mail) => {
      mail.recipients.forEach((rec) => {
        const key = rec.userId || `email:${rec.email}`
        if (!map.has(key)) {
          map.set(key, { status: rec.status, mailId: mail.id })
        }
      })
    })
    return map
  }, [data])

  const participantIdSet = useMemo(() => {
    if (!data) return new Set<string>()
    return new Set(data.participants.map((p) => p.userId))
  }, [data])

  const userSearchFeedback = useMemo(() => {
    const q = userSearch.trim()
    if (!q) return 'İsim veya e-posta yazarak üye arayın.'
    if (q.length < 2) return 'Arama başlatmak için en az 2 karakter yazın.'
    if (searchingUsers) return 'Kullanıcılar aranıyor…'
    if (userResults.length === 0) return 'Sonuç bulunamadı.'
    return ''
  }, [userSearch, searchingUsers, userResults])

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose()
        setMessage(null)
        setComposerOpen(false)
        clearSelection()
        setExtraEmailsText('')
        setUserSearch('')
        setUserResults([])
        setSearchingUsers(false)
        setAddBusyId(null)
        setRemoveBusyId(null)
      }}
      title={`${eventTitle} – Katılımcılar`}
      size="xl"
      contentClassName="bg-slate-50 px-8 py-6"
    >
      <div className="flex flex-col gap-6">
        <section className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Etkinlik tarihi</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{formatDateTime(startsAt)}</div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/clubs/${clubSlug}`} target="_blank" className={`${pillButton} font-semibold text-gray-700`}>
                Etkinlik sayfası
              </Link>
              <button onClick={downloadCsv} className={`${pillButton} font-semibold text-gray-700`}>
                CSV indir
              </button>
            </div>
          </div>
          {data && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-sm text-gray-500">
                Toplam <span className="font-semibold text-gray-900">{data.participants.length}</span> katılımcı
                {selectedIds.size > 0 && (
                  <>
                    {' • '}
                    <span className="font-medium text-gray-900">{selectedIds.size}</span> seçili
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-700">
                <button onClick={selectAll} className={pillButton}>Tümünü seç</button>
                <button onClick={clearSelection} className={pillButton}>Seçimi temizle</button>
                {!composerOpen && (
                  <button
                    onClick={() => {
                      setComposerOpen(true)
                      setNote('')
                    }}
                    className={`${primaryButton} shadow`}
                  >
                    Yeni mail oluştur
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {message && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-800 shadow-sm">
            {message}
          </div>
        )}
        {loading && <div className="text-sm text-gray-500">Yükleniyor…</div>}
        {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-600 shadow-sm">{error}</div>}

        {data && (
          <div className="flex flex-col gap-6">
            <section className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-gray-100 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Mail yönetimi</h2>
                  <p className="text-xs text-gray-500">Taslağı kaydedin, ardından hedef kitlenize gönderin.</p>
                </div>
                {!composerOpen && (
                  <button
                    onClick={() => {
                      setComposerOpen(true)
                      setNote('')
                    }}
                    className={`${primaryButton} hidden md:inline-flex`}
                  >
                    Yeni mail oluştur
                  </button>
                )}
              </div>

              {composerOpen && (
                <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 sm:p-5 space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Mail notu</div>
                    <p className="mt-1 text-xs text-gray-500">Bu metin hatırlatma şablonunun gövdesinde yer alacak.</p>
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Katılımcılara iletmek istediğiniz notu yazın"
                    className="h-28 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleSaveMail}
                      disabled={saving}
                      className={`${primaryButton} px-5`}
                    >
                      {saving ? 'Kaydediliyor…' : 'Taslağı kaydet'}
                    </button>
                    <button
                      onClick={() => {
                        setComposerOpen(false)
                        setNote('')
                      }}
                      className={`${subtleButton} px-5`}
                    >
                      İptal et
                    </button>
                  </div>
                </div>
              )}

              {data.mailHistory.length > 0 ? (
                <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="w-full sm:max-w-xs">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gönderilecek mail</label>
                    <select
                      value={selectedMailId}
                      onChange={(e) => setSelectedMailId(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {data.mailHistory.map((mail) => (
                        <option key={mail.id} value={mail.id}>
                          {mail.subject} · {new Date(mail.createdAt).toLocaleDateString('tr-TR')}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedMail && selectedMail.note && (
                    <div className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600 shadow-inner">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Taslak notu</div>
                      <div className="max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed">{selectedMail.note}</div>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={sendMailToAll}
                      disabled={!selectedMailId || sending}
                      className={`${primaryButton} px-5`}
                    >
                      Herkese gönder
                    </button>
                    <button
                      onClick={sendMailToSelected}
                      disabled={!selectedMailId || selectedIds.size === 0 || sending}
                      className={`${subtleButton} px-5`}
                    >
                      Seçililere gönder
                    </button>
                  </div>
                </div>
              ) : (
                !composerOpen && (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-4 text-sm text-gray-600">
                    Henüz kayıtlı bir mail taslağı yok. İlk taslak için “Yeni mail oluştur” butonunu kullanın.
                  </div>
                )
              )}

              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ek e-posta alıcıları</label>
                <input
                  value={extraEmailsText}
                  onChange={(e) => setExtraEmailsText(e.target.value)}
                  placeholder="ornek@site.com, baska@site.com"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="mt-1 text-xs text-gray-500">
                  Virgülle ayırarak dilediğiniz adresleri ekleyebilirsiniz.
                  {extraEmailCount > 0 && <span className="ml-1 font-semibold text-gray-700">{extraEmailCount} e-posta eklendi.</span>}
                  {extraEmailInvalid.length > 0 && (
                    <span className="ml-1 font-semibold text-rose-600">
                      Geçersiz: {extraEmailInvalid.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Katılımcı listesi</h2>
                  <p className="text-xs text-gray-500">Seçim yaparak belirli kişilere mail gönderebilirsiniz.</p>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-900">Katılımcı ekle</label>
                  <p className="text-xs text-gray-500">İsim veya e-posta yazarak kullanıcıyı listeye dahil edin.</p>
                </div>
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ör. Ayşe Yılmaz ya da ornek@site.com"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {userSearchFeedback && <div className="text-xs text-gray-500">{userSearchFeedback}</div>}
                {userSearch.trim().length >= 2 && userResults.length > 0 && (
                  <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-white/80 bg-white">
                    {userResults.map((user) => {
                      const alreadyIn = participantIdSet.has(user.id)
                      const busy = addBusyId === user.id
                      return (
                        <li key={user.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                          <div>
                            <div className="font-medium text-gray-900">{user.name || 'İsimsiz'}</div>
                            <div className="text-xs text-gray-500">{user.email || 'E-posta yok'}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddParticipant(user.id)}
                            disabled={alreadyIn || busy}
                            className={`${primaryButton} px-3 py-1 text-xs ${alreadyIn || busy ? 'opacity-60 cursor-default' : ''}`}
                          >
                            {alreadyIn ? 'Zaten listede' : busy ? 'Ekleniyor…' : 'Listeye ekle'}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-6 py-3 w-10">Seç</th>
                      <th className="px-6 py-3">Üye</th>
                      <th className="px-6 py-3">E-posta</th>
                      <th className="px-6 py-3">Kaynak</th>
                      <th className="px-6 py-3">Son durum</th>
                      <th className="px-6 py-3 text-right">Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.participants.map((participant) => {
                      const key = participant.userId || `email:${participant.email}`
                      const status = statusMap.get(key)
                      const isModeratorSource = participant.sources.some((s) => s.type === 'moderator')
                      return (
                        <tr key={participant.userId} className="align-middle bg-white">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(participant.userId)}
                              onChange={() => toggleSelection(participant.userId)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar src={participant.avatarUrl || undefined} size={40} alt={participant.name || ''} />
                              <div>
                                <div className="font-medium text-gray-900">{participant.name || 'İsimsiz'}</div>
                                <div className="text-xs text-gray-500">
                                  {participant.username ? `@${participant.username}` : '—'}
                                  {participant.slug && (
                                    <>
                                      {' · '}
                                      <Link href={`/u/${participant.slug}`} className="text-primary hover:underline" target="_blank">Profili aç</Link>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {participant.email ? (
                              <a href={`mailto:${participant.email}`} className="font-medium text-primary hover:underline">{participant.email}</a>
                            ) : (
                              <span className="text-xs text-gray-500">E-posta yok</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {participant.sources.map((s) => sourceLabel(s)).join(', ')}
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {status ? statusBadge(status.status) : <span className="text-gray-400">Mail gönderilmedi</span>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                className={`${subtleButton} px-3 text-xs`}
                                onClick={() => {
                                  setComposerOpen(true)
                                  setSelectedIds(new Set([participant.userId]))
                                }}
                              >
                                Yeni mail
                              </button>
                              <button
                                className={`${subtleButton} px-3 text-xs`}
                                onClick={() => sendMailToSingle(participant.userId)}
                                disabled={!selectedMailId || sending}
                              >
                                Seçili maili gönder
                              </button>
                              <button
                                className={`${subtleButton} px-3 text-xs text-rose-600 border-rose-200`}
                                onClick={() => handleRemoveParticipant(participant.userId)}
                                disabled={isModeratorSource || removeBusyId === participant.userId}
                                title={isModeratorSource ? 'Moderatör kaldırılamaz' : undefined}
                              >
                                {removeBusyId === participant.userId ? 'Kaldırılıyor…' : 'Listeden çıkar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-gray-100 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Gönderim geçmişi</h2>
                <p className="text-xs text-gray-500">Taslak ve gönderimlerin durumunu buradan takip edin.</p>
              </div>
              {data.mailHistory.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-4 text-sm text-gray-600">
                  Henüz mail gönderilmemiş.
                </div>
              )}
              {data.mailHistory.map((mail) => {
                const sentCount = mail.recipients.filter((r) => r.status === 'SENT').length
                const failedCount = mail.recipients.filter((r) => r.status === 'FAILED').length
                const total = mail.recipients.length
                const expanded = expandedMail === mail.id
                const isDraft = mail.sendScope === 'DRAFT' || total === 0
                return (
                  <div key={mail.id} className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setExpandedMail(expanded ? null : mail.id)}
                      className="flex w-full items-center justify-between gap-4 text-left"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900">{mail.subject}</div>
                          {isDraft && <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">Taslak</span>}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {formatDateTime(mail.createdAt)} · {mail.createdBy?.name || 'Admin'} {isDraft ? '· Henüz gönderim yapılmadı' : `· ${total} kişi (✔️ ${sentCount}${failedCount ? `, ❌ ${failedCount}` : ''})`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            const extras = getValidExtraEmails()
                            if (extras === null) return
                            handleResend(mail.id, undefined, extras)
                          }}
                          className={`${subtleButton} px-3 text-xs`}
                          disabled={sending}
                        >
                          {isDraft ? 'Gönder (tümü)' : 'Yeniden gönder (tümü)'}
                        </button>
                        {selectedIds.size > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const extras = getValidExtraEmails()
                              if (extras === null) return
                              handleResend(mail.id, Array.from(selectedIds), extras)
                            }}
                            className={`${subtleButton} px-3 text-xs`}
                            disabled={sending}
                          >
                            {isDraft ? 'Gönder (seçili)' : 'Seçililere gönder'}
                          </button>
                        )}
                        <span className="text-xs text-gray-400">{expanded ? '▲' : '▼'}</span>
                      </div>
                    </button>
                    {expanded && (
                      <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 text-sm text-gray-700">
                        {mail.note && (
                          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-500">İletilen not</div>
                            <div className="whitespace-pre-wrap">{mail.note}</div>
                          </div>
                        )}
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-100 text-xs">
                            <thead className="bg-slate-50 text-left font-semibold uppercase tracking-wide text-gray-500">
                              <tr>
                                <th className="px-3 py-2">Alıcı</th>
                                <th className="px-3 py-2">E-posta</th>
                                <th className="px-3 py-2">Durum</th>
                                <th className="px-3 py-2">Aksiyon</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {mail.recipients.map((rec) => (
                                <tr key={rec.id}>
                                  <td className="px-3 py-2">{rec.name || '—'}</td>
                                  <td className="px-3 py-2">{rec.email}</td>
                                  <td className="px-3 py-2">{statusBadge(rec.status, rec.error)}</td>
                                  <td className="px-3 py-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const extras = getValidExtraEmails()
                                        if (extras === null) return
                                        handleResend(mail.id, [rec.userId || rec.id], extras)
                                      }}
                                      className={`${subtleButton} px-3 text-[11px]`}
                                      disabled={sending}
                                    >
                                      Tekrar gönder
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </section>
          </div>
        )}

        {(saving || sending) && <div className="text-xs text-gray-500">İşlem devam ediyor…</div>}
      </div>
    </Modal>
  )
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseEmailList(input: string) {
  const valid: string[] = []
  const invalid: string[] = []
  const seen = new Set<string>()

  if (!input) return { valid, invalid }

  input
    .split(/[,;\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((email) => {
      const lower = email.toLowerCase()
      if (seen.has(lower)) return
      if (EMAIL_REGEX.test(email)) {
        valid.push(email)
        seen.add(lower)
      } else if (!invalid.includes(email)) {
        invalid.push(email)
      }
    })

  return { valid, invalid }
}

function safeCsv(value: string) {
  const v = value?.toString() ?? ''
  if (/[",\n]/.test(v)) {
    return '"' + v.replace(/"/g, '""') + '"'
  }
  return v
}

function formatDate(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('tr-TR')
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatCurrency(amount: number) {
  return amount.toFixed(2)
}

function sourceLabel(source: Participant['sources'][number]) {
  if (source.type === 'membership') {
    return `Üyelik ${source.joinedAt ? `(${formatDate(source.joinedAt)})` : ''}`
  }
  if (source.type === 'moderator') {
    return 'Moderatör'
  }
  return `Abonelik ${source.startedAt ? `(${formatDate(source.startedAt)})` : ''}`
}

function statusBadge(status: string, error?: string | null) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium'
  switch (status) {
    case 'SENT':
      return <span className={`${base} bg-green-100 text-green-700`}>Gönderildi</span>
    case 'FAILED':
      return <span className={`${base} bg-rose-100 text-rose-700`} title={error || undefined}>Hata</span>
    case 'PENDING':
      return <span className={`${base} bg-amber-100 text-amber-700`}>Gönderiliyor</span>
    default:
      return <span className={`${base} bg-gray-100 text-gray-600`}>{status}</span>
  }
}

function latestMailId(history: MailHistory[]) {
  return history.length ? history[0].id : ''
}
