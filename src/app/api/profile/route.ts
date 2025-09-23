// src/app/api/profile/route.ts
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return new Response('Unauthorized', { status: 401 })

  const form = await req.formData()

  // Form alanları (mevcut davranışlar korunur)
  const id = (form.get('id') as string) || ''
  const name = (form.get('name') as string) || ''
  const city = ((form.get('city') as string) || null)
  const bio = ((form.get('bio') as string) || null)

  // ✅ YENİ: avatarUrl desteği — upload endpointinden dönen URL’i al
  // Boş string gelirse null’a çeviriyoruz (avatar’ı temizlemek için)
  const avatarUrlRaw = form.get('avatarUrl')
  const avatarUrl =
    typeof avatarUrlRaw === 'string'
      ? avatarUrlRaw.trim() || null
      : null

  // Güvenlik: Form’daki id’nin oturumdaki kullanıcıya ait olduğundan emin ol
  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  if (!me || (id && me.id !== id)) {
    return new Response('Forbidden', { status: 403 })
  }

  // Güncellenecek veri nesnesini derle (avatarUrl opsiyonel)
  const data: any = { name, city, bio }
  if (avatarUrl !== undefined) {
    data.avatarUrl = avatarUrl
  }

  await prisma.user.update({
    where: { id: me.id },
    data,
  })

  // Mevcut davranış: ayarlar sayfasına dön
  return new Response(null, { status: 302, headers: { Location: '/profile/settings' } })
}
