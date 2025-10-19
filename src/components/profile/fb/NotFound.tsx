// src/components/profile/fb/NotFound.tsx
export default function NotFound() {
  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 p-4">
      <div className="text-lg font-semibold">Kullanıcı bulunamadı</div>
      <div className="text-sm text-gray-600">
        Bu kullanıcı adına ait bir profil yok.
      </div>
    </div>
  )
}
