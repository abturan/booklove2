// src/components/admin/CreativeManager.tsx
'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import CreativeForm from '@/components/admin/CreativeForm'

type CreativeData = {
  id: string
  title: string | null
  type: 'image_full' | 'announcement'
  device: 'all' | 'mobile' | 'desktop'
  imageUrl: string | null
  mobileImageUrl: string | null
  desktopImageUrl: string | null
  linkUrl: string | null
  mobileHtml?: string | null
  desktopHtml?: string | null
  html?: string | null
  active: boolean
  weight: number
}

type Props = {
  campaignId: string
  creatives: (CreativeData & { updateAction: (formData: FormData) => Promise<void> })[]
  createAction: (formData: FormData) => Promise<void>
  reorderAction: (formData: FormData) => Promise<void>
  deleteAction: (formData: FormData) => Promise<void>
  toggleAction: (formData: FormData) => Promise<void>
}

type Panel =
  | { key: string; kind: 'existing'; data: CreativeData; updateAction: (formData: FormData) => Promise<void>; open: boolean }
  | { key: string; kind: 'new'; open: boolean }

export default function CreativeManager({ campaignId, creatives, createAction, reorderAction, deleteAction, toggleAction }: Props) {
  const sortedCreatives = useMemo(
    () =>
      [...creatives]
        .sort((a, b) => a.weight - b.weight)
        .map(({ updateAction, ...rest }) => ({ data: rest as CreativeData, updateAction })),
    [creatives]
  )
  const [panels, setPanels] = useState<Panel[]>(() =>
    sortedCreatives.map((entry) => ({ key: entry.data.id, kind: 'existing', data: entry.data, updateAction: entry.updateAction, open: false as boolean }))
  )
  const [isPending, startTransition] = useTransition()

  // Sync when server data changes (revalidation)
  useEffect(() => {
    setPanels((prev) => {
      const freshMap = new Map(sortedCreatives.map((entry) => [entry.data.id, entry]))
      const merged: Panel[] = []
      const seen = new Set<string>()
      for (const panel of prev) {
        if (panel.kind === 'existing') {
          const fresh = freshMap.get(panel.data.id)
          if (fresh) {
            merged.push({ key: fresh.data.id, kind: 'existing', data: fresh.data, updateAction: fresh.updateAction, open: panel.open })
            seen.add(fresh.data.id)
          }
        } else {
          // keep unsaved drafts
          merged.push(panel)
        }
      }
      for (const entry of sortedCreatives) {
        if (!seen.has(entry.data.id)) {
          merged.push({ key: entry.data.id, kind: 'existing', data: entry.data, updateAction: entry.updateAction, open: false })
        }
      }
      return merged.sort((a, b) => {
        const wa = a.kind === 'existing' ? a.data.weight : -Infinity
        const wb = b.kind === 'existing' ? b.data.weight : -Infinity
        return wa - wb
      })
    })
  }, [sortedCreatives])

  function addNewPanel() {
    const key = `new-${Date.now()}`
    setPanels((prev) => [{ key, kind: 'new', open: true }, ...prev])
  }

  function removeNewPanel(key: string) {
    setPanels((prev) => prev.filter((p) => !(p.kind === 'new' && p.key === key)))
  }

  function togglePanel(key: string) {
    setPanels((prev) => prev.map((panel) => (panel.key === key ? { ...panel, open: !panel.open } : panel)))
  }

  const [dragKey, setDragKey] = useState<string | null>(null)

  function handleDragStart(key: string) {
    setDragKey(key)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  function handleDrop(targetKey: string) {
    if (!dragKey || dragKey === targetKey) return
    setPanels((prev) => {
      const dragging = prev.find((p) => p.key === dragKey)
      const targetIndex = prev.findIndex((p) => p.key === targetKey)
      const dragIndex = prev.findIndex((p) => p.key === dragKey)
      if (!dragging || dragIndex === -1 || targetIndex === -1) return prev
      const next = [...prev]
      next.splice(dragIndex, 1)
      next.splice(targetIndex, 0, dragging)
      commitOrder(next)
      return next
    })
    setDragKey(null)
  }

  function commitOrder(nextPanels: Panel[]) {
    const ids = nextPanels.filter((p) => p.kind === 'existing').map((p) => (p as Extract<Panel, { kind: 'existing' }>).data.id)
    const formData = new FormData()
    formData.append('order', JSON.stringify(ids))
    startTransition(() => reorderAction(formData))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reklam kreatifleri</h3>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{creatives.length} kayıt</span>
          <button
            type="button"
            onClick={addNewPanel}
            className="rounded-full bg-primary px-3 py-1.5 text-sm text-white hover:opacity-90"
          >
            Yeni reklam ekle
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {panels.map((panel) => {
          if (panel.kind === 'new') {
            return (
              <div key={panel.key} className="rounded-2xl border border-dashed bg-white/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-medium">Yeni reklam</div>
                  <button type="button" onClick={() => removeNewPanel(panel.key)} className="text-sm text-gray-500 hover:text-gray-700">
                    Vazgeç
                  </button>
                </div>
                <CreativeForm
                  campaignId={campaignId}
                  submitAction={createAction}
                  onCancel={() => removeNewPanel(panel.key)}
                />
              </div>
            )
          }

          const { data, updateAction } = panel
          const summaryTitle = data.title || 'Başlıksız reklam'

          return (
            <div
              key={panel.key}
              className={`rounded-2xl border bg-white/60 transition ${dragKey === panel.key ? 'opacity-60' : ''}`}
              draggable
              onDragStart={() => handleDragStart(panel.key)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(panel.key)}
              onDragEnd={() => setDragKey(null)}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => togglePanel(panel.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    togglePanel(panel.key)
                  }
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left outline-none focus:ring-2 focus:ring-primary/40 ${dragKey === panel.key ? 'cursor-grabbing' : 'cursor-grab'}`}
              >
                <div>
                  <div className="font-medium text-gray-900">{summaryTitle}</div>
                  <div className="text-xs text-gray-500">
                    {data.type === 'announcement' ? 'Duyuru' : 'Görsel'} · {deviceLabel(data.device)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={toggleAction} onClick={(e) => e.stopPropagation()}>
                    <input type="hidden" name="id" value={data.id} />
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="active" value={data.active ? '0' : '1'} />
                    <button
                      className={`rounded-full border px-2.5 py-1 text-xs ${data.active ? 'text-green-700 bg-green-50' : 'text-gray-600 bg-gray-50'}`}
                    >
                      {data.active ? 'Aktif' : 'Pasif'}
                    </button>
                  </form>
                  <form action={deleteAction} onClick={(e) => e.stopPropagation()}>
                    <input type="hidden" name="id" value={data.id} />
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <button className="rounded-full border px-2.5 py-1 text-xs text-red-700 hover:bg-red-50">Sil</button>
                  </form>
                  <span className="text-xs text-gray-400">{panel.open ? '▲' : '▼'}</span>
                </div>
              </div>

              {panel.open && (
                <div className="border-t px-4 py-4">
                  <CreativeForm
                    campaignId={campaignId}
                    initial={data}
                    submitAction={updateAction}
                  />
                </div>
              )}
            </div>
          )
        })}
        {!panels.length && (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-gray-500">
            Henüz kreatif yok. “Yeni reklam ekle” butonuyla ilk reklamı oluşturabilirsiniz.
          </div>
        )}
      </div>
      {isPending && <div className="text-xs text-gray-500">Sırayı kaydediyor…</div>}
    </div>
  )
}

function deviceLabel(device: string | null | undefined) {
  switch (device) {
    case 'mobile':
      return 'Sadece mobil'
    case 'desktop':
      return 'Sadece desktop'
    default:
      return 'Tüm cihazlar'
  }
}
