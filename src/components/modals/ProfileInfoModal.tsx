//src/components/modals/ProfileInfoModal.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

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
  const [basePhone, setBasePhone] = useState(initial.phone ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [sendBusy, setSendBusy] = useState(false)
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [verified, setVerified] = useState(false)
  const [sendMsg, setSendMsg] = useState<string | null>(null)
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null)
  const [resendSec, setResendSec] = useState(0)
  const timerRef = useRef<number | null>(null)

  const validPhone = (s: string) => /^[0-9 +()-]{7,20}$/.test(s)

  // Mask helpers — light, generic international style
  function unmaskPhone(v: string) {
    // Always keep a leading +; strip all other non-digits
    const digits = v.replace(/\D/g, '')
    return `+${digits}`
  }

  function formatPhoneDisplay(raw: string) {
    const s = unmaskPhone(raw)
    const hasPlus = s.startsWith('+')
    const digits = hasPlus ? s.slice(1) : s
    if (!digits) return hasPlus ? '+' : ''

    // Guess country code length (support explicit +90 and +1 well)
    let ccLen = 0
    if (hasPlus) {
      if (digits.startsWith('1')) ccLen = 1
      else if (digits.startsWith('90')) ccLen = 2
      else if (digits.length <= 3) ccLen = digits.length
      else ccLen = Math.min(3, 2) // default to 2 where possible
    }
    const cc = hasPlus ? digits.slice(0, Math.min(ccLen, digits.length)) : ''
    let rest = hasPlus ? digits.slice(cc.length) : digits

    const parts: string[] = []

    // Country code in parentheses when present: (+CC)
    if (hasPlus) parts.push(`(+${cc})`)

    // Country‑specific grouping
    if (hasPlus && cc === '90') {
      // TR: 5xx xxx xx xx (allow partial as user types)
      if (rest.startsWith('0')) rest = rest.slice(1)
      const g1 = rest.slice(0, 3)
      let rem = rest.slice(g1.length)
      const g2 = rem.slice(0, 3); rem = rem.slice(g2.length)
      const g3 = rem.slice(0, 2); rem = rem.slice(g3.length)
      const g4 = rem.slice(0, 2); rem = rem.slice(g4.length)
      if (g1) parts.push(g1)
      if (g2) parts.push(g2)
      if (g3) parts.push(g3)
      if (g4) parts.push(g4)
      if (rem) parts.push(rem)
    } else if (hasPlus && cc === '1') {
      // US/CA: XXX XXX XXXX
      const a = rest.slice(0, 3)
      let r = rest.slice(a.length)
      const b = r.slice(0, 3); r = r.slice(b.length)
      const c = r.slice(0, 4); r = r.slice(c.length)
      if (a) parts.push(a)
      if (b) parts.push(b)
      if (c) parts.push(c)
      if (r) parts.push(r)
    } else {
      // Generic fallback: group by 3s then 2s
      let r = rest
      const segs: string[] = []
      while (r.length > 0) {
        const take = r.length > 6 ? 3 : r.length > 4 ? 2 : r.length
        segs.push(r.slice(0, take))
        r = r.slice(take)
      }
      parts.push(...segs)
    }

    return parts.join(' ').replace(/\s+/g, ' ').trim()
  }

  function onPhoneInput(v: string) {
    setPhone(formatPhoneDisplay(v))
  }

  function onPhoneFocus() {
    // Prefill +90 when empty so the first digits go after it
    if (!phone.trim()) setPhone('(+90) ')
  }

  // When modal opens, refresh phone + verification status from server
  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        const r = await fetch('/api/me', { cache: 'no-store' })
        const j = await r.json().catch(() => null)
        if (r.ok && j) {
          const raw = typeof j.phone === 'string' && j.phone ? j.phone : (initial.phone ?? '')
          setBasePhone(raw || '')
          if (raw) setPhone(formatPhoneDisplay(raw))
          setVerified(Boolean(j.phoneVerifiedAt))
          // clear transient states
          setCode('')
          setCodeSent(false)
          setSendMsg(null)
          setErr(null)
          setResendSec(0)
        }
      } catch {}
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      return
    }
    if (resendSec <= 0) return
    timerRef.current = window.setTimeout(() => setResendSec((s) => Math.max(s - 1, 0)), 1000)
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current) }
  }, [resendSec, open])

  // If user edits the phone number, require re-verification
  useEffect(() => {
    if (!open) return
    if ((basePhone ?? '').trim() !== phone.trim()) {
      setVerified(false)
      setCode('')
      setCodeSent(false)
      setVerifyMsg(null)
    }
  }, [phone, open, basePhone])

  const sendCode = async () => {
    setSendMsg(null); setErr(null)
    if (!validPhone(phone)) { setErr('Geçerli bir telefon girin (örn: +90 5xx xxx xx xx)'); return }
    setSendBusy(true)
    try {
      const res = await fetch('/api/phone/send-code', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: phone.trim() }) })
      const j = await res.json().catch(() => null)
      if (!res.ok || j?.ok !== true) {
        // Eğer kısa süre önce gönderildiyse, geri sayım ve kod alanını göster
        if (res.status === 429 && typeof j?.retryAfter === 'number') {
          setCodeSent(true)
          setResendSec(Math.max(1, Math.ceil(j.retryAfter)))
          setErr(j?.error || 'Kod zaten gönderildi. Lütfen biraz bekleyin.')
        } else {
          throw new Error(j?.error || 'Kod gönderilemedi.')
        }
        return
      }
      setCodeSent(true)
      setSendMsg('Doğrulama kodu gönderildi.')
      if (j?.debug) setSendMsg(`Doğrulama kodu gönderildi. (Geliştirici: ${j.debug})`)
      setResendSec(60)
    } catch (e: any) {
      setErr(e?.message || 'Kod gönderilemedi.')
    } finally {
      setSendBusy(false)
    }
  }

  const verifyCode = async () => {
    setVerifyMsg(null); setErr(null)
    if (!/^\d{6}$/.test(code.trim())) { setErr('6 haneli doğrulama kodunu girin.'); return }
    setVerifyBusy(true)
    try {
      const res = await fetch('/api/phone/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: code.trim() }) })
      const j = await res.json().catch(() => null)
      if (!res.ok || j?.ok !== true) throw new Error(j?.error || 'Kod doğrulanamadı.')
      setVerified(true)
      setVerifyMsg(null)
    } catch (e: any) {
      setErr(e?.message || 'Kod doğrulanamadı.')
    } finally {
      setVerifyBusy(false)
    }
  }

  const save = async () => {
    setErr(null)
    if (!city.trim()) return setErr('İl (şehir) zorunludur.')
    if (!district.trim()) return setErr('İlçe zorunludur.')
    if (!validPhone(phone)) return setErr('Telefon numarası geçerli değil.')
    const phoneChanged = (initial.phone ?? '').trim() !== phone.trim()
    if (phoneChanged && !verified) {
      return setErr('Telefon numarasını kaydetmeden önce SMS doğrulamasını tamamlayın.')
    }
    setBusy(true)
    try {
      const res = await fetch('/api/me', {
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold">Üyelik için kısa bilgi</div>
        <p className="text-sm text-gray-600 mt-1">
          İl, ilçe ve telefon bilgilerin eksik görünüyor. Lütfen tamamla.
          Telefon numaran için doğrulama gereklidir.
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
            <div className="flex items-center gap-2 mt-1">
              <input
                value={phone}
                onChange={(e) => onPhoneInput(e.target.value)}
                onFocus={onPhoneFocus}
                className="flex-1 px-3 py-2 rounded-lg border"
                placeholder="(+90) 5xx xxx xx xx"
                inputMode="tel"
                aria-label="Telefon"
                disabled={verified}
              />
              {!verified && (
                <button type="button" onClick={sendCode} disabled={sendBusy || resendSec > 0} className="px-3 py-2 rounded-lg border disabled:opacity-60">
                  {sendBusy ? 'Gönderiliyor…' : resendSec > 0 ? `Tekrar: ${resendSec}s` : 'Kod Gönder'}
                </button>
              )}
            </div>
            {!verified && sendMsg && <div className="mt-1 text-xs text-green-700">{sendMsg}</div>}
            {verified && <div className="mt-1 text-xs text-green-700">Telefon doğrulandı ✔</div>}
          </div>
          {!verified && codeSent && (
            <div>
              <label className="text-sm font-medium">SMS Kod</label>
              <div className="flex items-center gap-2 mt-1">
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D+/g, '').slice(0, 6))} className="flex-1 px-3 py-2 rounded-lg border" placeholder="6 haneli kod" />
                <button type="button" onClick={verifyCode} disabled={verifyBusy || code.length !== 6} className="px-3 py-2 rounded-lg bg-rose-600 text-white disabled:opacity-60">
                  {verifyBusy ? 'Doğrulanıyor…' : 'Doğrula'}
                </button>
              </div>
              {verifyMsg && <div className="mt-1 text-xs text-green-700">{verifyMsg}</div>}
            </div>
          )}
          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button className="px-4 py-2 rounded-lg border" onClick={onClose}>Vazgeç</button>
          <button className="px-4 py-2 rounded-lg bg-rose-600 text-white disabled:opacity-60" disabled={busy || ((basePhone ?? '').trim() !== phone.trim() && !verified)} onClick={save}>
            {busy ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
