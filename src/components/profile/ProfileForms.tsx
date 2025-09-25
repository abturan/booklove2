// src/components/profile/ProfileForms.tsx
'use client'

import * as React from 'react'
import Image from 'next/image'

type Me = {
  id: string
  name: string | null
  bio: string | null
  avatarUrl: string | null
  email: string
  username?: string | null
}

export default function ProfileForms({ me }: { me: Me }) {
  const [name, setName] = React.useState(me.name ?? '')
  const [bio, setBio] = React.useState(me.bio ?? '')
  const [username, setUsername] = React.useState(me.username ?? '')
  const [avatarUrl, setAvatarUrl] = React.useState(me.avatarUrl ?? '')
  const [preview, setPreview] = React.useState<string | null>(me.avatarUrl)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [avatarMsg, setAvatarMsg] = React.useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [profileMsg, setProfileMsg] = React.useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [curPwd, setCurPwd] = React.useState('')
  const [newPwd, setNewPwd] = React.useState('')
  const [newPwd2, setNewPwd2] = React.useState('')
  const [pwdBusy, setPwdBusy] = React.useState(false)
  const [pwdMsg, setPwdMsg] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setName(me.name ?? '')
    setBio(me.bio ?? '')
    setUsername(me.username ?? '')
    setAvatarUrl(me.avatarUrl ?? '')
    setPreview(me.avatarUrl ?? null)
  }, [me.id, me.name, me.bio, me.username, me.avatarUrl])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const okTypes = ['image/png', 'image/jpeg']
    if (!okTypes.includes(file.type)) {
      setAvatarMsg({ type: 'err', text: 'Lütfen PNG veya JPG dosyası seçin.' })
      e.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg({ type: 'err', text: 'Dosya boyutu 2MB’ı geçmemelidir.' })
      e.target.value = ''
      return
    }
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)
    setAvatarMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload?type=avatar', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.url) throw new Error(json?.error || 'Yükleme başarısız.')
      setAvatarUrl(json.url)
      const save = await fetch('/api/me', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ avatarUrl: json.url }),
      })
      const saved = await save.json().catch(() => null)
      if (!save.ok || saved?.ok !== true) throw new Error(saved?.error || 'Avatar kaydedilemedi.')
      setPreview(json.url)
      setAvatarMsg({ type: 'ok', text: 'Avatar başarıyla yüklendi.' })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('me:updated'))
      }
    } catch (err: any) {
      setAvatarMsg({ type: 'err', text: err.message || 'Yükleme sırasında bir hata oluştu.' })
      setPreview(me.avatarUrl)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setProfileMsg(null)
    try {
      const fd = new FormData()
      fd.append('id', me.id)
      fd.append('name', name.trim())
      fd.append('bio', bio.trim())
      if (avatarUrl) fd.append('avatarUrl', avatarUrl)
      if (username) fd.append('username', username.trim())
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: fd,
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Kaydedilemedi.')
      setProfileMsg({ type: 'ok', text: 'Profil bilgileri kaydedildi.' })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('me:updated'))
      }
    } catch (err: any) {
      setProfileMsg({ type: 'err', text: err.message || 'Kaydetme sırasında bir hata oluştu.' })
    } finally {
      setSaving(false)
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdBusy(true)
    setPwdMsg(null)
    try {
      if (newPwd.length < 6) throw new Error('Yeni şifre en az 6 karakter olmalı.')
      if (newPwd !== newPwd2) throw new Error('Yeni şifre tekrarı eşleşmiyor.')
      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd })
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Şifre güncellenemedi.')
      setPwdMsg('Şifre güncellendi.')
      setCurPwd('')
      setNewPwd('')
      setNewPwd2('')
    } catch (err: any) {
      setPwdMsg(err.message || 'İşlem sırasında bir hata oluştu.')
    } finally {
      setPwdBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSaveProfile} className="card p-6 space-y-6">
        <h3 className="text-lg font-semibold">Profil Bilgileri</h3>

        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white relative">
            {preview ? (
              <Image src={preview} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-gray-400 text-sm">Önizleme</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-2xl bg-gray-900 text-white disabled:opacity-60"
            disabled={uploading}
          >
            {uploading ? 'Yükleniyor…' : 'Dosya Seç'}
          </button>
          <div className="text-sm text-gray-600">PNG/JPG; maksimum ~2MB önerilir.</div>
        </div>

        {avatarMsg && (
          <div
            role="alert"
            className={`rounded-xl px-3 py-2 text-sm ${
              avatarMsg.type === 'ok'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {avatarMsg.text}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Ad Soyad</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="Ad Soyad"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Kullanıcı adı</label>
            <div className="flex items-center rounded-xl border bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-rose-300">
              <span className="text-gray-500 select-none">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                className="flex-1 ml-1 outline-none"
                placeholder="ornek.kullanici"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Public profil: {username ? `/u/${username}` : '/u/…'}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">E-posta</label>
          <input
            value={me.email}
            disabled
            className="w-full rounded-xl border bg-gray-100 px-3 py-2 text-gray-600"
          />
          <p className="text-xs text-gray-500 mt-1">E-posta adresi değiştirilemez.</p>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Kısa özgeçmiş</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-rose-300"
            placeholder="Kendinizden kısaca bahsedin…"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-2xl bg-rose-600 text-white disabled:opacity-60"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
          {profileMsg && (
            <span
              role="alert"
              className={`text-sm rounded-xl px-3 py-2 ${
                profileMsg.type === 'ok'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {profileMsg.text}
            </span>
          )}
        </div>
      </form>

      <form onSubmit={onChangePassword} className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold">Şifre Değiştir</h3>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Mevcut şifre</label>
          <input
            type="password"
            value={curPwd}
            onChange={(e) => setCurPwd(e.target.value)}
            required
            className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-rose-300"
            placeholder="Mevcut şifreniz"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Yeni şifre</label>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
            className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-rose-300"
            placeholder="En az 6 karakter"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Yeni şifre (tekrar)</label>
          <input
            type="password"
            value={newPwd2}
            onChange={(e) => setNewPwd2(e.target.value)}
            required
            className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-rose-300"
            placeholder="Yeni şifreyi tekrar yazın"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pwdBusy}
            className="px-4 py-2 rounded-2xl bg-gray-900 text-white disabled:opacity-60"
          >
            {pwdBusy ? 'Güncelleniyor…' : 'Şifreyi Güncelle'}
          </button>
          {pwdMsg && <span className="text-sm text-gray-700">{pwdMsg}</span>}
        </div>
      </form>
    </div>
  )
}






