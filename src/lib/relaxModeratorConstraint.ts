// src/lib/relaxModeratorConstraint.ts
import { prisma } from '@/lib/prisma'

let constraintChecked = false

/**
 * Older veritabanlarında moderatorId için unique constraint olabilir.
 * Admin kullanıcılarının birden fazla kulüp açabilmesi için bu kısıtı kaldırmaya çalışıyoruz.
 * Bu fonksiyon güvenli şekilde tekrar tekrar çağrılabilir.
 */
export async function relaxClubModeratorConstraint() {
  if (constraintChecked) return
  constraintChecked = true
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Club" DROP CONSTRAINT IF EXISTS "Club_moderatorId_key"')
  } catch (err) {
    console.warn('Club moderator constraint kaldırılamadı:', err)
  }
}
