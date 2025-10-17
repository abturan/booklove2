// src/components/club/UpcomingSessionCard.tsx
'use client'

function formatDateTR(iso?: string | null) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

function monthTitleTR(iso?: string | null) {
  if (!iso) return 'Planlanmadı'
  const d = new Date(iso)
  const month = new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(d)
  const cap = month.charAt(0).toUpperCase() + month.slice(1)
  return `${cap} oturumu`
}

export default function UpcomingSessionCard({
  nextEventISO,
  memberCount,
  capacity,
}: {
  nextEventISO: string | null
  memberCount: number
  capacity: number | null
}) {
  const hasEvent = !!nextEventISO

  return (
    <div className="rounded-2xl bg-gray-50 p-5 shadow-sm border border-gray-100">
      <div className="text-sm text-gray-500 mb-1">{monthTitleTR(nextEventISO)}</div>

      {hasEvent ? (
        <div className="text-base font-medium text-gray-800">
          {formatDateTR(nextEventISO)}
        </div>
      ) : (
        <div className="text-base text-gray-600 font-medium">Planlanmadı</div>
      )}

      <div className="mt-3 flex items-center justify-between text-sm text-gray-700">
        <span>Üye sayısı: {memberCount}</span>
        {typeof capacity === 'number' && (
          <span className="text-xs text-gray-500">
            Kontenjan: {capacity || '—'}
          </span>
        )}
      </div>
    </div>
  )
}
