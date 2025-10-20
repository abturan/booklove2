// src/components/club/ChatSection.tsx
'use client'

import ChatPanel from '@/components/ChatPanel'

export default function ChatSection({ enabled, clubId, isMember }: { enabled: boolean; clubId: string; isMember: boolean }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 pt-4">
        <div className="font-medium">Sohbet</div>
      </div>
      <div className="p-4 pt-2">
        <ChatPanel enabled={enabled} clubId={clubId} />
      </div>
      {!isMember && (
        <div className="px-4 pb-4 text-xs text-gray-600">
          Mesajlar herkese görünür; yalnızca aboneler yazabilir. Birini <code>@isim</code> ile etiketlediğinde bildirim oluşturulur.
        </div>
      )}
    </div>
  )
}
