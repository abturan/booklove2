-- Create extension for UUID generation (no-op if already present)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Add new columns as nullable so existing rows can be updated first
ALTER TABLE "ChatRoom" ADD COLUMN "clubEventId" TEXT;
ALTER TABLE "Membership" ADD COLUMN "clubEventId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "clubEventId" TEXT;
ALTER TABLE "PaymentIntent" ADD COLUMN "clubEventId" TEXT;

-- 2) Ensure every club has at least one event (fallback legacy event)
INSERT INTO "ClubEvent" ("id", "clubId", "startsAt", "title")
SELECT uuid_generate_v4(), c.id, NOW(), 'Legacy Etkinlik'
FROM "Club" c
WHERE NOT EXISTS (
  SELECT 1 FROM "ClubEvent" e WHERE e."clubId" = c.id
);

-- 3) Pick a canonical event per club (latest startsAt) to link existing records
WITH ranked_events AS (
  SELECT
    ce."clubId",
    ce.id,
    ROW_NUMBER() OVER (PARTITION BY ce."clubId" ORDER BY ce."startsAt" DESC, ce.id DESC) AS rn
  FROM "ClubEvent" ce
)
UPDATE "Membership" m
SET "clubEventId" = re.id
FROM ranked_events re
WHERE re."clubId" = m."clubId"
  AND re.rn = 1
  AND m."clubEventId" IS NULL;

WITH ranked_events AS (
  SELECT
    ce."clubId",
    ce.id,
    ROW_NUMBER() OVER (PARTITION BY ce."clubId" ORDER BY ce."startsAt" DESC, ce.id DESC) AS rn
  FROM "ClubEvent" ce
)
UPDATE "Subscription" s
SET "clubEventId" = re.id
FROM ranked_events re
WHERE re."clubId" = s."clubId"
  AND re.rn = 1
  AND s."clubEventId" IS NULL;

WITH ranked_events AS (
  SELECT
    ce."clubId",
    ce.id,
    ROW_NUMBER() OVER (PARTITION BY ce."clubId" ORDER BY ce."startsAt" DESC, ce.id DESC) AS rn
  FROM "ClubEvent" ce
)
UPDATE "PaymentIntent" p
SET "clubEventId" = re.id
FROM ranked_events re
WHERE re."clubId" = p."clubId"
  AND re.rn = 1
  AND p."clubEventId" IS NULL;

WITH ranked_events AS (
  SELECT
    ce."clubId",
    ce.id,
    ROW_NUMBER() OVER (PARTITION BY ce."clubId" ORDER BY ce."startsAt" DESC, ce.id DESC) AS rn
  FROM "ClubEvent" ce
)
UPDATE "ChatRoom" cr
SET "clubEventId" = re.id
FROM ranked_events re
WHERE re."clubId" = cr."clubId"
  AND re.rn = 1
  AND cr."clubEventId" IS NULL;

-- 4) At this point all rows should be linked; enforce NOT NULL
ALTER TABLE "ChatRoom" ALTER COLUMN "clubEventId" SET NOT NULL;
ALTER TABLE "Membership" ALTER COLUMN "clubEventId" SET NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "clubEventId" SET NOT NULL;
ALTER TABLE "PaymentIntent" ALTER COLUMN "clubEventId" SET NOT NULL;

-- 5) Add the expected indexes & constraints
CREATE UNIQUE INDEX IF NOT EXISTS "ChatRoom_clubEventId_key" ON "ChatRoom"("clubEventId");

DROP INDEX IF EXISTS "Membership_userId_clubId_key";
DROP INDEX IF EXISTS "Subscription_userId_clubId_key";

CREATE INDEX IF NOT EXISTS "Membership_clubEventId_idx" ON "Membership"("clubEventId");
CREATE UNIQUE INDEX IF NOT EXISTS "Membership_userId_clubEventId_key" ON "Membership"("userId", "clubEventId");

CREATE INDEX IF NOT EXISTS "Subscription_clubEventId_idx" ON "Subscription"("clubEventId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_clubEventId_key" ON "Subscription"("userId", "clubEventId");

CREATE INDEX IF NOT EXISTS "PaymentIntent_clubEventId_idx" ON "PaymentIntent"("clubEventId");

ALTER TABLE "ChatRoom"
  ADD CONSTRAINT "ChatRoom_clubEventId_fkey"
  FOREIGN KEY ("clubEventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Membership"
  ADD CONSTRAINT "Membership_clubEventId_fkey"
  FOREIGN KEY ("clubEventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Subscription"
  ADD CONSTRAINT "Subscription_clubEventId_fkey"
  FOREIGN KEY ("clubEventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentIntent"
  ADD CONSTRAINT "PaymentIntent_clubEventId_fkey"
  FOREIGN KEY ("clubEventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
