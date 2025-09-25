// src/lib/userPath.ts
import { slugify } from '@/lib/slugify'

export function userPath(username?: string | null, name?: string | null) {
  const u = typeof username === 'string' ? username : ''
  const n = typeof name === 'string' ? name : ''
  const trimmed = u ? u.trim() : ''
  const slug = trimmed.length > 0 ? trimmed : slugify(n || '')
  return `/u/${slug}`
}






