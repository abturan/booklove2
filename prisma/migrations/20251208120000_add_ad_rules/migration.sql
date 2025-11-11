-- Add the optional rules column used by ads (idempotent for prod copies)
ALTER TABLE "Ad" ADD COLUMN IF NOT EXISTS "rules" text;
