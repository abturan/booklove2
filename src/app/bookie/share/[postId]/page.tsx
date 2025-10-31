import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SharePageContent from './SharePageContent'

export const dynamic = 'force-dynamic'

export default async function BookieSharePage({ params, searchParams }: { params: { postId: string }; searchParams?: Record<string, string | undefined> }) {
  const post = await prisma.post.findFirst({
    where: { id: params.postId, status: 'PUBLISHED' },
    select: {
      id: true,
      body: true,
      owner: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
      images: { take: 1, select: { url: true } },
    },
  })
  if (!post) return notFound()

  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || 'https://boook.love'
  const origin = base.endsWith('/') ? base.slice(0, -1) : base
  const profileHandle = post.owner.username || post.owner.slug || post.owner.id
  const profileUrl = `${origin}/u/${profileHandle}`
  const shareUrl = `${origin}/bookie/share/${params.postId}`

  const trimmedBody = post.body?.trim() ?? ''
  const sharePreview = trimmedBody.length > 280 ? `${trimmedBody.slice(0, 277)}…` : trimmedBody

  const instagramMode = searchParams?.instagram === '1' || searchParams?.instagram === 'true'
  const downloadMode = searchParams?.download === '1' || searchParams?.download === 'true'

  return (
    <SharePageContent
      postId={post.id}
      body={post.body ?? ''}
      ownerName={post.owner.name || 'Bir okur'}
      ownerUsername={post.owner.username || post.owner.slug || null}
      ownerAvatar={post.owner.avatarUrl}
      imageUrl={post.images[0]?.url ?? null}
      profileUrl={profileUrl}
      shareUrl={shareUrl}
      sharePreview={sharePreview}
      instagramMode={instagramMode}
      downloadMode={downloadMode}
    />
  )
}
