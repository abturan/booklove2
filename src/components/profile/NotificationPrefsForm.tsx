// src/components/profile/NotificationPrefsForm.tsx
'use client'

import * as React from 'react'

type Prefs = {
  emailFollow: boolean
  emailPostLike: boolean
  emailPostComment: boolean
  emailClubModeratorPost: boolean
  emailClubModeratorSecret: boolean
  emailClubNewMessagesDaily: boolean
  emailClubCreated: boolean
  emailClubNewEvent: boolean
}

export default function NotificationPrefsForm() {
  const [prefs, setPrefs] = React.useState<Prefs | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [msg, setMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/notifications/prefs', { cache: 'no-store' })
        const j = await r.json()
        if (r.ok) setPrefs(j.prefs)
      } catch {}
    })()
  }, [])

  async function save() {
    if (!prefs) return
    setSaving(true); setMsg(null)
    try {
      const r = await fetch('/api/notifications/prefs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(prefs) })
      if (!r.ok) throw new Error('Kaydedilemedi')
      setMsg('Bildirim tercihleri kaydedildi.')
    } catch (e: any) {
      setMsg(e?.message || 'Kaydedilemedi')
    } finally { setSaving(false) }
  }

  if (!prefs) return <div className="card p-6 text-sm text-gray-600">Yükleniyor…</div>
  const on = (k: keyof Prefs) => (e: React.ChangeEvent<HTMLInputElement>) => setPrefs({ ...prefs, [k]: e.target.checked })

  return (
    <div id="notifications" className="card p-6 space-y-4">
      <h3 className="text-lg font-semibold">Bildirim Tercihleri (E‑posta)</h3>
      <div className="space-y-2">
        <Row label="Takip edildiğimde" checked={prefs.emailFollow} onChange={on('emailFollow')} />
        <Row label="Bookie beğenisi" checked={prefs.emailPostLike} onChange={on('emailPostLike')} />
        <Row label="Bookie yorumu" checked={prefs.emailPostComment} onChange={on('emailPostComment')} />
        <Row label="Moderatörden yeni mesaj" checked={prefs.emailClubModeratorPost} onChange={on('emailClubModeratorPost')} />
        <Row label="Moderatörden gizli mesaj" checked={prefs.emailClubModeratorSecret} onChange={on('emailClubModeratorSecret')} />
        <Row label="Etkinlikte yeni mesajlar (günlük)" checked={prefs.emailClubNewMessagesDaily} onChange={on('emailClubNewMessagesDaily')} />
        <Row label="Yeni kulüp" checked={prefs.emailClubCreated} onChange={on('emailClubCreated')} />
        <Row label="Kulübümde yeni etkinlik" checked={prefs.emailClubNewEvent} onChange={on('emailClubNewEvent')} />
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={saving} className="px-4 py-2 rounded-2xl bg-gray-900 text-white disabled:opacity-60">{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
        {msg && <span className="text-sm text-gray-700">{msg}</span>}
      </div>
    </div>
  )
}

function Row({ label, checked, onChange }: { label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-gray-300" />
      <span>{label}</span>
    </label>
  )
}
