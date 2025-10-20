// src/components/sidebars/profile/MemberClubsList.tsx
import Link from 'next/link'

export default function MemberClubsList({
  items,
}: {
  items: Array<{
    slug: string
    name: string
    bannerUrl: string | null
    _count?: { memberships?: number | null; picks?: number | null; events?: number | null }
  }>
}) {
  if (!items || items.length === 0) return null
  return (
    <section className="card p-5">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Üye Olduğu Kulüpler</h3>
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/clubs/${c.slug}`}
              className="group flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50 transition"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 ring-1 ring-slate-200">
                {/* küçük kapak */}
                {/* @ts-ignore */}
                <img
                  src={(c.bannerUrl || '').trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=200&auto=format&fit=crop'}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{c.name}</div>
                <div className="text-xs text-slate-500">
                  👥 {(c._count?.memberships ?? 0)} · 📚 {(c._count?.picks ?? 0)} · 🗓️ {(c._count?.events ?? 0)}
                </div>
              </div>
              <span className="ml-auto text-sm text-primary opacity-0 group-hover:opacity-100 transition">Git →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
