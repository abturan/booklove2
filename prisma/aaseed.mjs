// prisma/seed.mjs
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// --- TR uyumlu, bağımsız slugify (TS dosyasına ihtiyaç yok)
function slugify(input) {
  if (!input) return ''
  const map = {
    İ: 'I', I: 'I', ı: 'i', Ş: 'S', ş: 's', Ğ: 'G', ğ: 'g',
    Ü: 'U', ü: 'u', Ö: 'O', ö: 'o', Ç: 'C', ç: 'c',
  }
  const replaced = input
    .split('')
    .map((ch) => (map[ch] ? map[ch] : ch))
    .join('')
  return replaced
    .toLocaleLowerCase('tr')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')     // diakritikleri kaldır
    .replace(/[^a-z0-9]+/g, '-')         // harf/rakam dışını tire yap
    .replace(/^-+|-+$/g, '')             // baş/son tireyi kes
    .replace(/-{2,}/g, '-')              // çoklu tireyi tekle
}

// Basit avatar (dicebear)
const dice = (seed) =>
  `https://api.dicebear.com/8.x/thumbs/png?seed=${encodeURIComponent(seed)}`

// Aynı üyeliği iki kez eklememek için güvenli yardımcı
async function ensureMembership(userId, clubId) {
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
  console.log('— Seeding başladı —')

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
  const moderators = []
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

  // --- Kulüpler + Sohbet + Seçki + Etkinlik
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
  const clubs = []
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
        slug,
        name,
        description: 'Aylık seçkilerle birlikte okuyoruz ve üzerine sohbet ediyoruz.',
        city: 'İstanbul',
        bannerUrl:
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1600&auto=format&fit=crop',
        priceTRY: 49,
        moderatorId: moderators[i].id,
      },
    })
    clubs.push(club)

    // Sohbet odası (clubId unique olmalı)
    const room = await prisma.chatRoom.upsert({
      where: { clubId: club.id },
      update: {},
      create: { clubId: club.id },
    })

    // Sohbet mesajları (mention + cevap + emoji)
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
        // Şemanızda quotedId alanı olmalı (opsiyonel)
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

    // Bu ayın seçkisi (clubId+monthKey benzersiz olmalı)
    await prisma.clubPick.updateMany({
      where: { clubId: club.id },
      data: { isCurrent: false },
    })
    await prisma.clubPick.upsert({
      // Prisma şemanızda şu composite unique olmalı: @@unique([clubId, monthKey], name: "clubId_monthKey")
      where: { clubId_monthKey: { clubId: club.id, monthKey } },
      update: { bookId: book.id, isCurrent: true, note: 'Bu ayın seçkisi' },
      create: {
        clubId: club.id,
        bookId: book.id,
        monthKey,
        isCurrent: true,
        note: 'Bu ayın seçkisi',
      },
    })

    // Yaklaşan etkinlik (yoksa ekle)
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
  const users = []
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
  // %70'i kulüplere üye: tek/çift/üçlü üyelik dağıtımı
  const totalMembers = Math.round(users.length * 0.7)
  let singles = Math.round(totalMembers * 0.6)
  let doubles = Math.round(totalMembers * 0.1)
  let triples = Math.round(totalMembers * 0.05)
  const used = singles + doubles + triples
  if (used < totalMembers) singles += totalMembers - used

  const shuffled = [...users].sort(() => Math.random() - 0.5)
  let cursor = 0
  const pickClubIds = (k) => {
    const set = new Set()
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

  console.log('— Seed tamamlandı —')
}

main()
  .catch((e) => {
    console.error('Seed sırasında hata:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
