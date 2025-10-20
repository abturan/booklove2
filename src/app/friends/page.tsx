// src/app/friends/page.tsx
import LeftSidebar from '@/components/sidebars/LeftSidebar'
import FriendsPanel from '@/components/friends/FriendsPanel'

export const dynamic = 'force-dynamic'

export default async function FriendsPage() {
  // Bu sayfada banner yok (mobil + desktop)
  return (
    <div className="space-y-6 pt-4 lg:pt-0">
      {/* Mobil başlık */}
      <div className="pt-2 text-center">
        <div className="text-3xl font-extrabold tracking-tight primaryRed">Book Buddy</div>
        <div className="text-xl font-bold -mt-1">Arkadaşlar</div>
      </div>

      {/* 3’lü grid: solda menü, sağda panel */}
      <div className="grid lg:grid-cols-3 gap-6 min-h-0">
        <div className="hidden lg:block">
          <LeftSidebar />
        </div>

        <div className="lg:col-span-2">
          <FriendsPanel />
        </div>
      </div>
    </div>
  )
}
