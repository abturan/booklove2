// src/components/admin/CreativeForm.tsx
'use client'

import { useRef, useState } from 'react'

type CreativeDraft = {
  id?: string
  title?: string | null
  type?: 'image_full' | 'announcement'
  device?: 'all' | 'mobile' | 'desktop'
  imageUrl?: string | null
  mobileImageUrl?: string | null
  desktopImageUrl?: string | null
  linkUrl?: string | null
  html?: string | null
  mobileHtml?: string | null
  desktopHtml?: string | null
  active?: boolean
}

export default function CreativeForm({ campaignId, initial, submitAction, onCancel }: { campaignId: string; initial?: CreativeDraft | null; submitAction: (fd: FormData) => Promise<void>; onCancel?: () => void }) {
  const [draft, setDraft] = useState<CreativeDraft>(() => ({
    type: initial?.type || 'image_full',
    device: initial?.device || 'all',
    active: initial?.active ?? true,
    ...(initial || {}),
  }))
  const fileMob = useRef<HTMLInputElement | null>(null)
  const fileDesk = useRef<HTMLInputElement | null>(null)

  async function upload(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.set('file', file)
    const r = await fetch('/api/upload?type=ad', { method: 'POST', body: fd })
    const j = await r.json().catch(() => null)
    return r.ok && j?.url ? String(j.url) : null
  }

  async function onPick(which: 'mobile' | 'desktop', files: FileList | null) {
    const f = files?.[0]
    if (!f) return
    const url = await upload(f)
    if (!url) return
    setDraft((d) => (which === 'mobile' ? { ...d, mobileImageUrl: url } : { ...d, desktopImageUrl: url }))
  }

  return (
    <form action={submitAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          value={draft.title || ''}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="Başlık"
          className="rounded-xl border px-3 py-2"
        />
        <select value={draft.type} onChange={(e)=>setDraft(d=>({...d, type:e.target.value as any}))} className="rounded-xl border px-3 py-2">
          <option value="image_full">Tam görsel</option>
          <option value="announcement">Duyuru</option>
        </select>
        <select value={draft.device || 'all'} onChange={(e)=>setDraft(d=>({...d, device:e.target.value as any}))} className="rounded-xl border px-3 py-2">
          <option value="all">Tüm cihazlar</option>
          <option value="mobile">Sadece mobil</option>
          <option value="desktop">Sadece desktop</option>
        </select>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!draft.active} onChange={(e)=>setDraft(d=>({...d, active:e.target.checked}))} /> Aktif
        </label>
      </div>

      {draft.type === 'image_full' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span>Mobil görsel</span>
              <button type="button" onClick={()=>fileMob.current?.click()} className="rounded-full border px-2.5 py-1 text-xs">Yükle</button>
              <input ref={fileMob} type="file" accept="image/*" hidden onChange={(e)=>onPick('mobile', e.target.files)} />
            </div>
            <input
              value={draft.mobileImageUrl || ''}
              onChange={(e)=>setDraft(d=>({...d, mobileImageUrl:e.target.value}))}
              placeholder="Mobil görsel URL"
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span>Desktop görsel</span>
              <button type="button" onClick={()=>fileDesk.current?.click()} className="rounded-full border px-2.5 py-1 text-xs">Yükle</button>
              <input ref={fileDesk} type="file" accept="image/*" hidden onChange={(e)=>onPick('desktop', e.target.files)} />
            </div>
            <input
              value={draft.desktopImageUrl || ''}
              onChange={(e)=>setDraft(d=>({...d, desktopImageUrl:e.target.value}))}
              placeholder="Desktop görsel URL"
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>
        </div>
      )}

      {draft.type === 'announcement' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <textarea value={draft.mobileHtml || ''} onChange={(e)=>setDraft(d=>({...d, mobileHtml:e.target.value}))} placeholder="Mobil HTML" rows={5} className="rounded-xl border px-3 py-2" />
          <textarea value={draft.desktopHtml || ''} onChange={(e)=>setDraft(d=>({...d, desktopHtml:e.target.value}))} placeholder="Desktop HTML" rows={5} className="rounded-xl border px-3 py-2" />
        </div>
      )}

      <input value={draft.linkUrl || ''} onChange={(e)=>setDraft(d=>({...d, linkUrl:e.target.value}))} placeholder="Hedef URL (opsiyonel)" className="rounded-xl border px-3 py-2" />

      <input type="hidden" name="title" value={draft.title || ''} />
      <input type="hidden" name="type" value={draft.type || 'image_full'} />
      <input type="hidden" name="device" value={draft.device || 'all'} />
      <input type="hidden" name="imageUrl" value={draft.imageUrl || ''} />
      <input type="hidden" name="mobileImageUrl" value={draft.mobileImageUrl || ''} />
      <input type="hidden" name="desktopImageUrl" value={draft.desktopImageUrl || ''} />
      <input type="hidden" name="linkUrl" value={draft.linkUrl || ''} />
      <input type="hidden" name="html" value={draft.html || ''} />
      <input type="hidden" name="mobileHtml" value={draft.mobileHtml || ''} />
      <input type="hidden" name="desktopHtml" value={draft.desktopHtml || ''} />
      <input type="hidden" name="campaignId" value={campaignId} />
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="active" value={draft.active ? 'on' : ''} />

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50">
            İptal
          </button>
        )}
        <button className="rounded-full bg-primary px-4 py-2 text-white">Kaydet</button>
      </div>
    </form>
  )
}
