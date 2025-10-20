// src/lib/avatar.ts
export function safeAvatarUrl(url?: string | null) {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (!trimmed) return 'https://i.pravatar.cc/120?img=15';
  // absolute ise dokunma
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // data url ise dokunma
  if (/^data:image\//i.test(trimmed)) return trimmed;
  // / ile başlıyorsa kökten al
  if (trimmed.startsWith('/')) return trimmed;
  // aksi halde relatif kabul et ve kökten bağla
  return `/${trimmed.replace(/^\.?\/*/, '')}`;
}
