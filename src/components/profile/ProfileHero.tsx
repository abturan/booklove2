// src/components/profile/ProfileHero.tsx
import Image from 'next/image'
import clsx from 'clsx'

type Props = {
  name: string
  username?: string | null
  avatarUrl?: string | null
  bannerUrl?: string | null
  /** Sağ üstte aksiyon alanı (istek gönder, düzenle vb.). İsterseniz null bırakın. */
  actionSlot?: React.ReactNode
}

/**
 * Facebook benzeri kapak + büyük avatar başlığı.
 * Server Component'tir (use client yok). Function prop almaz.
 */
export default function ProfileHero({
  name,
  username,
  avatarUrl,
  bannerUrl,
  actionSlot,
}: Props) {
  const cover =
    typeof bannerUrl === 'string' && bannerUrl.trim().length > 0
      ? bannerUrl
      : 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1600&auto=format&fit=crop'

  return (
    <section className="relative">
      {/* Kapak */}
      <div className="relative h-56 md:h-72 lg:h-80 rounded-3xl overflow-hidden">
        <Image
          src={cover}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Alta doğru koyu geçiş – yazılar/avatara kontrast için */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
      </div>

      {/* Alt bilgi şeridi: avatar + isim + aksiyon */}
      <div className="relative">
        {/* Avatar, kapağın alt kenarına taşsın */}
        <div className="container mx-auto px-4">
          <div className="-mt-14 md:-mt-16 lg:-mt-20 flex items-end justify-between">
            <div className="flex items-end gap-4 md:gap-6">
              <div
                className={clsx(
                  'relative rounded-full overflow-hidden ring-4 ring-white shadow-xl bg-gray-100',
                )}
                style={{ width: 132, height: 132 }} // ~3x büyüklük
                aria-label={name}
              >
                {/* Kapaktan gelen yerel upload’lar optimize edilmesin */}
                {/* Boşsa dicebear benzeri fallback bırakabiliriz */}
                <Image
                  src={
                    avatarUrl && avatarUrl.trim()
                      ? avatarUrl
                      : `https://api.dicebear.com/8.x/thumbs/png?seed=${encodeURIComponent(
                          name || 'user',
                        )}`
                  }
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="132px"
                  unoptimized={!!(avatarUrl && avatarUrl.startsWith('/uploads/'))}
                />
              </div>

              <div className="pb-2">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900">
                  {name}
                </h1>
                {username && (
                  <div className="text-gray-600 font-medium">@{username}</div>
                )}
              </div>
            </div>

            {/* Sağ aksiyon alanı */}
            <div className="pb-3">{actionSlot}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
