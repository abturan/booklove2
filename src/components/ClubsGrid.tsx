//src/components/ClubsGrid.tsx
'use client'

import { useEffect, useState } from "react";
import FilterBar, { type FilterValue } from "@/components/FilterBar";

type ClubCard = {
  id: string;
  slug: string;
  name: string;
  moderator?: string;
  memberCount: number;
  bannerUrl?: string | null;
};

export default function ClubsGrid() {
  const [filters, setFilters] = useState<FilterValue>({
    q: "",
    sort: "members_desc",
  });
  const [items, setItems] = useState<ClubCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.sort) params.set("sort", filters.sort);
      const res = await fetch(`/api/clubs?${params.toString()}`);
      const data = await res.json();
      if (!cancelled) {
        setItems(data?.items ?? data ?? []);
        setLoading(false);
      }
    }
    run();
    return () => { cancelled = true };
  }, [filters]);

  return (
    <section className="mt-6 space-y-6">
      <FilterBar initial={filters} onChange={setFilters} />

      {loading ? (
        <div className="text-sm text-gray-500">Yükleniyor…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">Sonuç bulunamadı.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((c) => (
            <a
              key={c.id}
              href={`/clubs/${c.slug}`}
              className="group rounded-2xl overflow-hidden bg-white border hover:shadow-md transition"
            >
              <div className="h-36 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={c.name}
                  src={c.bannerUrl || "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1600&auto=format&fit=crop"}
                  className="h-full w-full object-cover group-hover:scale-[1.02] transition"
                />
              </div>
              <div className="p-4">
                <div className="font-medium">{c.name}</div>
                <div className="mt-1 text-sm text-gray-500">{c.moderator}</div>
                <div className="mt-3 text-xs text-gray-600">👥 {c.memberCount} üye</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
