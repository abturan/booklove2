// src/lib/userPath.ts
import { slugify } from '@/lib/slugify'

export function userPath(username?: string | null, name?: string | null, slug?: string | null) {
  const s = typeof slug === 'string' ? slug.trim() : ''
  if (s) return `/u/${s}`
  const u = typeof username === 'string' ? username.trim() : ''
  if (u) return `/u/${u}`
  const n = typeof name === 'string' ? name : ''
  const fallback = slugify(n || '')
  return `/u/${fallback}`
}
