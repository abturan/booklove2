// src/app/clubs/[slug]/Banner.tsx
import Image from 'next/image'

export default function Banner({ url }: { url: string }) {
  return (
    <div className="relative hidden h-64 overflow-hidden rounded-3xl sm:block md:h-80">
      <Image src={url} alt="" fill className="object-cover" priority />
    </div>
  )
}
