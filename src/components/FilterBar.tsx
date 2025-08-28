'use client'

import { useEffect, useMemo, useState } from "react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";

type SortKey = "members_desc" | "members_asc" | "created_desc" | "created_asc";

export type FilterValue = { q: string; sort: SortKey };

export default function FilterBar({
  initial = { q: "", sort: "members_desc" },
  onChange
}: {
  initial?: FilterValue;
  onChange?: (v: FilterValue) => void;
}) {
  const [q, setQ] = useState(initial.q);
  const [sort, setSort] = useState<SortKey>(initial.sort);

  // küçük bir debounce ki yazarken titreme olmasın
  const debounced = useDebounce(q, 250);

  useEffect(() => {
    onChange?.({ q: debounced, sort });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, sort]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Yazar, kulüp veya moderatör ara…"
            aria-label="Ara"
            className="pl-11"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-3.6-3.6" />
          </svg>
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Temizle"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="w-[260px]">
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sırala"
          >
            <option value="members_desc">Kullanıcı sayısı (çoktan aza)</option>
            <option value="members_asc">Kullanıcı sayısı (azdan çoğa)</option>
            <option value="created_desc">Yeni eklenenler</option>
            <option value="created_asc">En eskiler</option>
          </Select>
        </div>
      </div>
    </div>
  );
}

function useDebounce<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
