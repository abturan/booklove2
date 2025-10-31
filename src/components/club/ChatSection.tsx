// src/components/club/ChatSection.tsx
'use client'

import ChatPanel from '@/components/ChatPanel'
import clsx from 'clsx'

export default function ChatSection({
  enabled,
  eventId,
  isMember,
  messageCount,
  onCountChange,
}: {
  enabled: boolean
  eventId: string | null
  isMember: boolean
  messageCount?: number
  onCountChange?: (count: number) => void
}) {
  const hasRoom = typeof eventId === 'string' && eventId.length > 0

  return (
    <section className="overflow-hidden rounded-[26px] border-2 border-[#fa3d30]/30 bg-white">
      <header className="flex items-center justify-between bg-[#fa3d30] px-5 py-4 text-white">
        <h3 className="text-sm font-semibold uppercase tracking-[0.28em]">Etkinlik Sohbeti</h3>
        {typeof messageCount === 'number' && (
          <span className="inline-flex items-center justify-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#fa3d30] shadow-[0_0_0_1px_rgba(255,255,255,0.4)]">
            {Math.min(messageCount, 999)}
          </span>
        )}
      </header>
      <div className="grid gap-3 px-5 py-4">
        {!hasRoom && (
          <div className="rounded-xl border border-dashed border-white/40 bg-white/10 px-4 py-3 text-sm text-white/80">
            İlk mesajı bırakan siz olun; sohbet bu etkinlik için birazdan oluşturulacak.
          </div>
        )}
        <div className={clsx('rounded-2xl bg-white/95 px-3 pb-3 pt-2 shadow-inner', !hasRoom && 'pointer-events-none opacity-50')}>
          <ChatPanel
            enabled={enabled && hasRoom}
            eventId={hasRoom ? eventId : null}
            onCountChange={onCountChange}
          />
        </div>
        {!isMember && (
          <div className="rounded-xl border border-[#fa3d30]/20 bg-[#fa3d30]/5 px-4 py-3 text-xs text-[#a52a23]">
            Mesajlar herkese görünür; yalnızca katılımcılar yazabilir. Birini <code>@isim</code> ile etiketlediğinde bildirim oluşturulur.
          </div>
        )}
      </div>
    </section>
  )
}
