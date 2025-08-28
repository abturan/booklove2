'use client'

import { useState, useTransition } from 'react'

export default function PublishButton({
  id,
  initial,
}: { id: string; initial: boolean }) {
  const [published, setPublished] = useState(initial)
  const [pending, start] = useTransition()

  const toggle = () => {
    start(async () => {
      const res = await fetch(`/api/admin/clubs/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !published }),
      })
      if (res.ok) setPublished((p) => !p)
      else alert('Güncellenemedi.')
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`rounded-full px-3 py-1.5 ${
        published ? 'bg-white border text-gray-900' : 'bg-emerald-600 text-white'
      } ${pending ? 'opacity-60' : ''}`}
      title={published ? 'Yayından kaldır' : 'Yayınla'}
    >
      {published ? 'Yayından kaldır' : 'Yayınla'}
    </button>
  )
}
