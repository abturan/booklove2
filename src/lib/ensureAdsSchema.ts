// src/lib/ensureAdsSchema.ts
import { prisma } from '@/lib/prisma'

let ensured = false

export async function ensureAdsSchema() {
  if (ensured) return
  try {
    // Campaign table
    await (prisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdCampaign" (
        id text PRIMARY KEY,
        name text NOT NULL,
        type text NOT NULL DEFAULT 'rotate',
        frequency integer NOT NULL DEFAULT 1,
        scope text NOT NULL DEFAULT 'all',
        active boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
    `)

    // Creative table
    await (prisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Ad" (
        id text PRIMARY KEY,
        title text NOT NULL,
        type text NOT NULL DEFAULT 'image_full',
        slot text NOT NULL DEFAULT 'feed',
        "imageUrl" text,
        "mobileImageUrl" text,
        "desktopImageUrl" text,
        "linkUrl" text,
        html text,
        "mobileHtml" text,
        "desktopHtml" text,
        device text NOT NULL DEFAULT 'all',
        active boolean NOT NULL DEFAULT true,
        "startsAt" timestamptz,
        "endsAt" timestamptz,
        weight integer NOT NULL DEFAULT 1,
        "campaignId" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
    `)
    // Add columns defensively (for environments where table exists but columns are missing)
    const alterCols = [
      'ADD COLUMN IF NOT EXISTS "imageUrl" text',
      'ADD COLUMN IF NOT EXISTS "mobileImageUrl" text',
      'ADD COLUMN IF NOT EXISTS "desktopImageUrl" text',
      'ADD COLUMN IF NOT EXISTS "linkUrl" text',
      'ADD COLUMN IF NOT EXISTS html text',
      'ADD COLUMN IF NOT EXISTS "mobileHtml" text',
      'ADD COLUMN IF NOT EXISTS "desktopHtml" text',
      'ADD COLUMN IF NOT EXISTS rules text',
      'ADD COLUMN IF NOT EXISTS "campaignId" text',
      "ADD COLUMN IF NOT EXISTS device text NOT NULL DEFAULT 'all'",
      'ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true',
      'ADD COLUMN IF NOT EXISTS "startsAt" timestamptz',
      'ADD COLUMN IF NOT EXISTS "endsAt" timestamptz',
      'ADD COLUMN IF NOT EXISTS weight integer NOT NULL DEFAULT 1',
      'ADD COLUMN IF NOT EXISTS "createdAt" timestamptz NOT NULL DEFAULT now()',
      'ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz NOT NULL DEFAULT now()',
      "ALTER COLUMN type SET DEFAULT 'image_full'",
      "ALTER COLUMN slot SET DEFAULT 'feed'",
    ]
    for (const stmt of alterCols) {
      try {
        await (prisma as any).$executeRawUnsafe(`ALTER TABLE "Ad" ${stmt};`)
      } catch {}
    }
  } catch {
    // no-op: keep page functional even if ensure fails
  } finally {
    ensured = true
  }
}
