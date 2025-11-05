// src/components/admin/CampaignForm.tsx
'use client'

import { useState } from 'react'

type CampaignDraft = {
  id?: string
  name?: string
  type?: 'rotate' | 'pinned_top'
  frequency?: number
  scope?: 'all' | 'global' | 'following'
  active?: boolean
}

export default function CampaignForm({ initial, submitAction }: { initial?: CampaignDraft | null; submitAction: (fd: FormData) => Promise<void> }) {
  const [draft, setDraft] = useState<CampaignDraft>(() => ({
    name: initial?.name || '',
    type: initial?.type || 'rotate',
    frequency: initial?.frequency || 1,
    scope: initial?.scope || 'all',
    active: initial?.active ?? true,
  }))

  return (
    <form action={submitAction} className="space-y-4 rounded-2xl border p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          value={draft.name || ''}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          type="text"
          placeholder="Kampanya adı"
          className="rounded-xl border px-3 py-2"
        />
        <select
          value={draft.type}
          onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as 'rotate' | 'pinned_top' }))}
          className="rounded-xl border px-3 py-2"
        >
          <option value="rotate">Döngüsel (sırayla göster)</option>
          <option value="pinned_top">En üstte sabit</option>
        </select>
        <label className="text-sm">
          <div className="mb-1">Sıklık (her N gönderide bir)</div>
          <input
            value={draft.frequency ?? 1}
            onChange={(e) => setDraft((d) => ({ ...d, frequency: Number(e.target.value || '1') }))}
            type="number"
            min={1}
            disabled={draft.type !== 'rotate'}
            className="w-full rounded-xl border px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1">Görünürlük</div>
          <select
            value={draft.scope}
            onChange={(e) => setDraft((d) => ({ ...d, scope: e.target.value as any }))}
            className="w-full rounded-xl border px-3 py-2"
          >
            <option value="all">Tümü</option>
            <option value="global">Herkes (public)</option>
            <option value="following">Takip edilenler</option>
          </select>
        </label>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!draft.active}
          onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
        />
        Kampanya aktif
      </label>

      <input type="hidden" name="name" value={draft.name || ''} />
      <input type="hidden" name="type" value={draft.type || 'rotate'} />
      <input type="hidden" name="frequency" value={draft.type === 'rotate' ? String(draft.frequency || 1) : '0'} />
      <input type="hidden" name="scope" value={draft.scope || 'all'} />
      <input type="hidden" name="active" value={draft.active ? 'on' : ''} />

      <div className="pt-2">
        <button className="rounded-full bg-primary px-4 py-2 text-white">Kaydet</button>
      </div>
    </form>
  )
}
