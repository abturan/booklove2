-- Create simple Ad table for banners and feed slots
CREATE TABLE IF NOT EXISTS "Ad" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'image_full',
  "slot" TEXT NOT NULL DEFAULT 'feed',
  "imageUrl" TEXT,
  "linkUrl" TEXT,
  "html" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "weight" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- lightweight updatedAt trigger for Postgres (optional, ignore if not supported)
-- This block is safe to fail if DB isn't Postgres; our server actions can still update updatedAt explicitly if needed.
