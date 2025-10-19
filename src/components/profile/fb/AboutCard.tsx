// src/components/profile/fb/AboutCard.tsx
export default function AboutCard({ user }: { user: any }) {
  const text =
    user?.bio ||
    'Künye bilgisi eklenmemiş. Profil ayarlarından kendinizi tanıtabilirsiniz.'
  return (
    <div className="rounded-2xl bg-[#1f1f1f] text-white p-4">
      <div className="text-xl font-extrabold mb-2">Künye</div>
      <div className="text-[15px] leading-6 text-gray-200 whitespace-pre-wrap">
        {text}
      </div>
    </div>
  )
}
