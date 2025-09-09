'use client'

import { useState } from 'react'

type Props = {
  open: boolean
  initial: { city?: string | null; district?: string | null; phone?: string | null }
  onClose: () => void
  onSaved: (v: { city: string; district: string; phone: string }) => void
}

export default function ProfileInfoModal({ open, initial, onClose, onSaved }: Props) {
  const [city, setCity] = useState(initial.city ?? '')
  const [district, setDistrict] = useState(initial.district ?? '')
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!open) return null

  const validPhone = (s: string) => /^[0-9 +()-]{7,20}$/.test(s)

  const save = async () => {
    setErr(null)
    if (!city.trim()) return setErr('İl (şehir) zorunludur.')
    if (!district.trim()) return setErr('İlçe zorunludur.')
    if (!validPhone(phone)) return setErr('Telefon numarası geçerli değil.')
    setBusy(true)
    try {
      const res = await fetch('/api/me/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.trim(), district: district.trim(), phone: phone.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) {
        setErr(json?.error || 'Kaydederken bir hata oluştu.')
        return
      }
      onSaved({ city: city.trim(), district: district.trim(), phone: phone.trim() })
    } catch (e) {
      setErr('Sunucuya ulaşılamadı.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold">Üyelik için kısa bilgi</div>
        <p className="text-sm text-gray-600 mt-1">
          İl, ilçe ve telefon bilgilerin eksik görünüyor. Lütfen tamamla.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium">İl (Şehir)</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border" />
          </div>
          <div>
            <label className="text-sm font-medium">İlçe</label>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border" />
          </div>
          <div>
            <label className="text-sm font-medium">Telefon</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border" placeholder="+90 ..." />
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button className="px-4 py-2 rounded-lg border" onClick={onClose}>Vazgeç</button>
          <button className="px-4 py-2 rounded-lg bg-rose-600 text-white disabled:opacity-60" disabled={busy} onClick={save}>
            {busy ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
