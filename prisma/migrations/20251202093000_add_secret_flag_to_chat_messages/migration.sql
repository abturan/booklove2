-- Add secret flag for moderator-only chat messages
ALTER TABLE "public"."ChatMessage"
ADD COLUMN     "isSecret" BOOLEAN NOT NULL DEFAULT false;
