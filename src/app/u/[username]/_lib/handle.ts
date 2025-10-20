// src/app/u/[username]/_lib/handle.ts
export function sanitizeHandle(s: string) {
  try { return decodeURIComponent((s || '').replace(/^@+/, '')).trim() } catch { return (s || '').replace(/^@+/, '').trim() }
}
export function deslug(s: string) { return (s || '').replace(/-/g, ' ').trim() }
export function normalizeTR(s: string) {
  return (s || '').replace(/ç/gi,'c').replace(/ğ/gi,'g').replace(/[ıİ]/g,'i').replace(/ö/gi,'o').replace(/ş/gi,'s').replace(/ü/gi,'u').trim()
}
export function variants(raw: string) {
  const base = deslug(raw); const a = normalizeTR(base); const b = base.replace(/ı/g,'i').replace(/i/g,'ı')
  return Array.from(new Set([base,a,b])).filter(Boolean)
}
export function toTRDiacriticVersion(t: string) {
  return (t || '').replace(/c/g,'ç').replace(/g/g,'ğ').replace(/i/g,'ı').replace(/o/g,'ö').replace(/s/g,'ş').replace(/u/g,'ü')
}
