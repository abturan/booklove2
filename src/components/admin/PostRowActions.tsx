// src/components/admin/PostRowActions.tsx
'use client'

export default function PostRowActions({ id, onDone }: { id: string; onDone?: () => void }) {
  async function hide() {
    if (!confirm('Gönderiyi gizlemek istiyor musunuz?')) return
    await fetch(`/api/posts/${id}/moderate`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'hide' }),
    }).catch(() => {})
    onDone?.()
  }
  async function del() {
    if (!confirm('Gönderiyi kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.')) return
    const fd = new FormData()
    fd.set('id', id)
    await fetch('/admin/posts/delete', { method: 'POST', body: fd }).catch(() => {})
    onDone?.()
  }
  return (
    <div className="flex justify-end gap-2">
      <button onClick={hide} className="rounded-full border px-2.5 py-1 text-xs hover:bg-gray-50 whitespace-nowrap">Gizle</button>
      <button onClick={del} className="rounded-full border px-2.5 py-1 text-xs hover:bg-gray-50 whitespace-nowrap">Sil</button>
    </div>
  )
}
