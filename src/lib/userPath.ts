// src/lib/userPath.ts
import { slugify } from '@/lib/slugify'

export function userPath(username?: string | null, name?: string | null, slug?: string | null) {
  const s = typeof slug === 'string' ? slug.trim() : ''
  if (s) return `/u/${encodeURIComponent(s.toLowerCase())}`

  const uRaw = typeof username === 'string' ? username.replace(/^@+/, '').trim() : ''
  const safeUsername = /^[a-z0-9._-]+$/i.test(uRaw) ? uRaw.toLowerCase() : ''
  if (safeUsername) return `/u/${encodeURIComponent(safeUsername)}`

  const n = typeof name === 'string' ? name.trim() : ''
  const fallback = slugify(n || '').toLowerCase()
  return `/u/${encodeURIComponent(fallback)}`
}
