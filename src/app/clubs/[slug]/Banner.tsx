// src/app/clubs/[slug]/Banner.tsx
import Image from 'next/image'

export default function Banner({ url }: { url: string }) {
  return (
    <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden">
      <Image src={url} alt="" fill className="object-cover" priority />
    </div>
  )
}
