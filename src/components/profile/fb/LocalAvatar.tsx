// src/components/profile/fb/LocalAvatar.tsx
export default function LocalAvatar({
  src,
  alt,
  size = 40,
}: {
  src?: string | null
  alt?: string
  size?: number
}) {
  return (
    <img
      src={
        src ||
        'https://api.dicebear.com/8.x/initials/svg?backgroundType=gradientLinear'
      }
      alt={alt || 'Avatar'}
      width={size}
      height={size}
      className="h-full w-full object-cover"
    />
  )
}
