'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export default function DeleteClubButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  const onDelete = () => {
    if (!window.confirm(`"${name}" kulübünü silmek istediğine emin misin? Bu işlem geri alınamaz.`)) {
      return
    }
    start(async () => {
      try {
        const res = await fetch(`/api/admin/clubs/${id}`, { method: 'DELETE' })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          alert(data?.error || 'Kulüp silinemedi.')
          return
        }
        router.refresh()
      } catch (err: any) {
        alert(err?.message || 'Kulüp silinemedi.')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700 hover:bg-red-100 disabled:opacity-60"
    >
      {pending ? 'Siliniyor…' : 'Sil'}
    </button>
  )
}
