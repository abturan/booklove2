// src/components/profile/fb/PostsList.tsx
// Placeholder: Sadece bu kullanıcıya ait gönderiler gösterilecek alan.
export default function PostsList({ ownerId }: { ownerId: string }) {
  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 p-4">
      <div className="text-[15px] text-gray-700">
        Burada <b>SADECE bu kullanıcının</b> Bookie gönderileri listelenir.
        (API bağlarken: <code>?ownerId={ownerId}</code> parametresiyle filtrele.)
      </div>
    </div>
  )
}
