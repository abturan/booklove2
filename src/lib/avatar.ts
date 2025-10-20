// src/lib/avatar.ts

// Her çağrıda üretilecek rastgele seed
function randomSeed(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const a = new Uint32Array(2)
    crypto.getRandomValues(a)
    return `${a[0].toString(36)}${a[1].toString(36)}`
  }
  return Math.random().toString(36).slice(2)
}

/**
 * Boşsa dicebear placeholder döndürür.
 * İstersen ikinci parametreyle (seed) kişiye/şeye özel sabit seed verebilirsin.
 * Örn: safeAvatarUrl(null, user.id)
 */
export function safeAvatarUrl(url?: string | null, seed?: string) {
  const trimmed = typeof url === 'string' ? url.trim() : ''
  if (!trimmed) {
    const s = seed ?? randomSeed() // seed verilmediyse her çağrıda yeni üret
    return `https://api.dicebear.com/8.x/thumbs/png?seed=${encodeURIComponent(s)}`
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed           // absolute
  if (/^data:image\//i.test(trimmed)) return trimmed          // data url
  if (trimmed.startsWith('/')) return trimmed                 // root-relative
  return `/${trimmed.replace(/^\.?\/*/, '')}`                 // relative -> root
}