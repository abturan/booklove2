// scripts/backfill-slugs.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, slug: true },
  })

  for (const u of users) {
    if (u.slug && u.slug.length > 0) continue
    const base = (u.username && u.username.trim()) || slugify(u.name || '')
    if (!base) continue

    let slug = base, i = 1
    while (await prisma.user.findUnique({ where: { slug } })) {
      i += 1
      slug = `${base}-${i}`
    }
    await prisma.user.update({ where: { id: u.id }, data: { slug } })
    console.log(`updated ${u.id} -> ${slug}`)
  }
}

main().then(() => prisma.$disconnect()).catch(async (e) => {
  console.error(e); await prisma.$disconnect(); process.exit(1)
})
