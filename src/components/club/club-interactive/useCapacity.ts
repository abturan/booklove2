// src/components/club/club-interactive/useCapacity.ts
export function useCapacity(capacity: number | null, memberCount: number) {
  const soldOut = typeof capacity === 'number' && capacity >= 0 ? memberCount >= (capacity ?? 0) : false
  const remaining = typeof capacity === 'number' && capacity >= 0 ? Math.max((capacity ?? 0) - memberCount, 0) : null
  const nearSoldOut = typeof remaining === 'number' && remaining > 0 && remaining <= 10
  return { soldOut, remaining, nearSoldOut }
}
