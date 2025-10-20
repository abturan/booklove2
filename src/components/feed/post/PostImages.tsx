// src/components/feed/post/PostImages.tsx
export default function PostImages({ images }: { images: { url: string }[] }) {
  if (!images || images.length === 0) return null
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {images.map((img, i) => (
        <img key={i} src={img.url} alt="" className="rounded-2xl object-cover w-full h-36" />
      ))}
    </div>
  )
}
