// src/app/u/[username]/_lib/canonical.ts
import { slugify } from '@/lib/slugify'
import type { UserLite } from './findUser'

export function canonicalFromUser(u: UserLite) {
  return u.username || u.slug || slugify((u.name || '').trim())
}
