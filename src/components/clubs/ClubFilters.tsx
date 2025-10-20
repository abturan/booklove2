// src/components/clubs/ClubFilters.tsx
'use client'

export default function ClubFilters({
  defaultSubscribed = false,
  onChange,
}: {
  defaultSubscribed?: boolean
  onChange: (f: { subscribed: boolean }) => void
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        defaultChecked={defaultSubscribed}
        onChange={(e) => onChange({ subscribed: e.currentTarget.checked })}
        className="size-4 rounded border"
      />
      <span>Sadece üye olduğun gruplar</span>
    </label>
  )
}
