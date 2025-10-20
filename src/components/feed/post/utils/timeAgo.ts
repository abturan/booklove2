// src/components/feed/post/utils/timeAgo.ts
export function timeAgo(iso: string) {
  const d = new Date(iso).getTime()
  const diff = Math.max(0, Date.now() - d)
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}dk`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}s`
  const day = Math.floor(h / 24)
  if (day < 7) return `${day}g`
  const w = Math.floor(day / 7)
  return `${w}h`
}
