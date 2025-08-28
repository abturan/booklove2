import { PrismaClient, type User, type Club } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { slugify } from '../src/lib/slugify'

const prisma = new PrismaClient()

// Basit avatar üretici (dicebear)
const dice = (seed: string) =>
  `https://api.dicebear.com/8.x/thumbs/png?seed=${encodeURIComponent(seed)}`

// Aynı üyeliği iki kez eklememek için güvenli yardımcı
async function ensureMembership(userId: string, clubId: string) {
  try {
    await prisma.membership.create({ data: { userId, clubId, isActive: true } })
  } catch {
    await prisma.membership.updateMany({
      where: { userId, clubId },
      data: { isActive: true },
    })
  }
}

async function main() {
  console.log('Seeding…')

  const adminPass = await bcrypt.hash('admin123', 10)
  const modPass = await bcrypt.hash('moderator123', 10)
  const userPass = await bcrypt.hash('user123', 10)
  const monthKey = new Date().toISOString().slice(0, 7) // YYYY-MM

  // --- Admin
  await prisma.user.upsert({
    where: { email: 'superadmin@book.love' },
    update: {},
    create: {
      email: 'superadmin@book.love',
      name: 'SuperAdmin',
      passwordHash: adminPass,
      role: 'ADMIN',
      avatarUrl: dice('superadmin'),
    },
  })

  // --- Moderatörler
  const modNames = [
    'Can Yalçın',
    'Yasemin Arslan',
    'Sarp Uysal',
    'Deniz Kaya',
    'Murat Aksoy',
    'Elif Demir',
    'Baran Güzel',
    'Ada Er',
    'Ekin Tamer',
    'Pelin Şen',
  ]
  const moderators: User[] = []
  for (let i = 0; i < 10; i++) {
    const email = `mod${i + 1}@book.love`
    const mod = await prisma.user.upsert({
      where: { email },
      update: { role: 'MODERATOR', avatarUrl: dice(email) },
      create: {
        email,
        name: modNames[i],
        passwordHash: modPass,
        role: 'MODERATOR',
        avatarUrl: dice(email),
      },
    })
    moderators.push(mod)
  }

  // --- Kulüpler
  const clubNames = [
    'Zamansız Satırlar',
    'Kırmızı Pencere Kulübü',
    'Ay Işığı Okurları',
    'Sessiz Bahçe Okuma',
    'Ada Okurları',
    'Toz ve Yıldız',
    'Sarp Okurları',
    'Yasemin Okurları',
    'Deniz Okurları',
    'Murat Okurları',
  ]
  const clubs: Club[] = []
  for (let i = 0; i < 10; i++) {
    const name = clubNames[i]
    const slug = slugify(name)

    const club = await prisma.club.upsert({
      where: { slug },
      update: {
        moderatorId: moderators[i].id,
        name,
      },
      create: {
        slug, // ✅ slugify kullanımı
        name,
        description:
          'Aylık seçkilerle birlikte okuyoruz ve üzerine sohbet ediyoruz.',
        city: 'İstanbul',
        bannerUrl:
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1600&auto=format&fit=crop',
        priceTRY: 49,
        moderatorId: moderators[i].id,
      },
    })
    clubs.push(club)

    // Sohbet odası
    const room = await prisma.chatRoom.upsert({
      where: { clubId: club.id },
      update: {},
      create: { clubId: club.id },
    })

    // --- Sohbet seed (mention + cevap + emoji)
    const authorA = moderators[i].id
    const authorB = moderators[(i + 1) % moderators.length].id

    const m1 = await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        authorId: authorA,
        body: 'Herkese merhaba! Bu ayın seçkisi hakkında ne düşünüyorsunuz? 😀',
      },
    })
    await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        authorId: authorB,
        body: `@${modNames[i]} bence harika bir seçim! Özellikle 2. bölüm çok iyi.`,
        // ⚠️ Prisma şemasında alan adı `quotedId` ise onu kullanmalıyız
        quotedId: m1.id,
      },
    })
    await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        authorId: authorA,
        body: 'Katılıyorum 👏 Favori alıntınızı yazın, yayında konuşalım.',
      },
    })
    await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        authorId: authorB,
        body: 'Benimki: “Zaman, ince bir sızı gibi işler.”',
      },
    })
    await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        authorId: authorA,
        body: 'Toplantı günü @Yasemin Arslan ve @Sarp Uysal ile canlı olacağız. 🗓️',
      },
    })
    await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        authorId: authorB,
        body: 'Harika! Görüşmek üzere 🙌',
      },
    })

    // Kitap
    const book = await prisma.book.create({
      data: {
        title: `Seçki ${i + 1}`,
        author: ['A. Kara', 'E. Mavi', 'L. Gri', 'S. Beyaz'][i % 4],
        coverUrl:
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
      },
    })

    // Bu ayın seçkisi — önce diğerlerini kapat, sonra upsert
    await prisma.clubPick.updateMany({
      where: { clubId: club.id },
      data: { isCurrent: false },
    })
    await prisma.clubPick.upsert({
      // Şemada şu index'in olduğunu varsayıyoruz:
      // @@unique([clubId, monthKey], name: "clubId_monthKey")
      where: { clubId_monthKey: { clubId: club.id, monthKey } } as any,
      update: { bookId: book.id, isCurrent: true, note: 'Bu ayın seçkisi' },
      create: {
        clubId: club.id,
        bookId: book.id,
        monthKey,
        isCurrent: true,
        note: 'Bu ayın seçkisi',
      },
    })

    // Yaklaşan etkinlik
    const existingEvent = await prisma.clubEvent.findFirst({
      where: { clubId: club.id },
    })
    if (!existingEvent) {
      await prisma.clubEvent.create({
        data: {
          clubId: club.id,
          startsAt: new Date(Date.now() + (i + 3) * 24 * 3600 * 1000),
          title: 'Aylık Oturum',
        },
      })
    }
  }

  // --- 100 kullanıcı
  const users: User[] = []
  for (let i = 1; i <= 100; i++) {
    const email = `user${String(i).padStart(3, '0')}@book.love`
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `Kullanıcı ${i}`,
        passwordHash: userPass,
        role: 'USER',
        avatarUrl: dice(email),
      },
    })
    users.push(u)
  }

  // Her kulüpte en az 1 üye (dummy)
  for (let i = 0; i < clubs.length; i++) {
    await ensureMembership(users[i].id, clubs[i].id)
  }

  // — Üyelik dağılımı —
  // %70'i kulüplere üye
  const totalMembers = Math.round(users.length * 0.7)
  let singles = Math.round(totalMembers * 0.6)
  let doubles = Math.round(totalMembers * 0.1)
  let triples = Math.round(totalMembers * 0.05)
  // Kalanı tek kulübe
  const used = singles + doubles + triples
  if (used < totalMembers) singles += totalMembers - used

  // Rastgele sırala
  const shuffled = [...users].sort(() => Math.random() - 0.5)
  let cursor = 0
  const pickClubIds = (k: number) => {
    const set = new Set<string>()
    while (set.size < k) {
      set.add(clubs[Math.floor(Math.random() * clubs.length)].id)
    }
    return [...set]
  }

  for (let i = 0; i < singles; i++) {
    const u = shuffled[cursor++ % shuffled.length]
    const [c] = pickClubIds(1)
    await ensureMembership(u.id, c)
  }
  for (let i = 0; i < doubles; i++) {
    const u = shuffled[cursor++ % shuffled.length]
    for (const c of pickClubIds(2)) await ensureMembership(u.id, c)
  }
  for (let i = 0; i < triples; i++) {
    const u = shuffled[cursor++ % shuffled.length]
    for (const c of pickClubIds(3)) await ensureMembership(u.id, c)
  }

  console.log('Seed completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
