// src/components/admin/EventParticipantsButton.tsx
'use client'

import { useState } from 'react'
import EventParticipantsModal from '@/components/admin/EventParticipantsModal'

type Props = {
  eventId: string
  eventTitle: string
  startsAt: string
  clubSlug: string
}

export default function EventParticipantsButton({ eventId, eventTitle, startsAt, clubSlug }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border px-2.5 py-1 text-xs hover:bg-gray-50"
      >
        Katılımcılar
      </button>
      <EventParticipantsModal
        eventId={eventId}
        eventTitle={eventTitle}
        startsAt={startsAt}
        clubSlug={clubSlug}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

