// src/components/profile/ProfileAboutCard.tsx
export default function ProfileAboutCard({ bio }: { bio?: string | null }) {
  const text = (bio || '').trim()
  if (!text) return null
  return (
    <div className="card p-5">
      <div className="text-sm font-semibold text-gray-900 mb-2">Hakkında</div>
      <div className="text-[15px] leading-7 text-gray-800 max-w-[65ch] whitespace-pre-line">
        {text}
      </div>
    </div>
  )
}
