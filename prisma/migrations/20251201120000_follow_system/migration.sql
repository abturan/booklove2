-- CreateEnum
CREATE TYPE "public"."DmThreadStatus" AS ENUM ('ACTIVE', 'REQUESTED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "public"."DmThread" ADD COLUMN     "status" "public"."DmThreadStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "public"."DmThread" ADD COLUMN     "requestedById" TEXT;
ALTER TABLE "public"."DmThread" ADD COLUMN     "requestedAt" TIMESTAMP(3);
ALTER TABLE "public"."DmThread" ADD COLUMN     "lastDecisionAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DmThread_status_idx" ON "public"."DmThread"("status");

-- CreateIndex
CREATE INDEX "DmThread_requestedById_idx" ON "public"."DmThread"("requestedById");

-- AddForeignKey
ALTER TABLE "public"."DmThread" ADD CONSTRAINT "DmThread_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data migration: copy existing friendships into follow edges
INSERT INTO "public"."Follow" ("id", "followerId", "followingId", "createdAt")
SELECT fr."id" || '_from', fr."fromId", fr."toId", COALESCE(fr."respondedAt", fr."createdAt")
FROM "public"."FriendRequest" fr
WHERE fr."status" = 'ACCEPTED'
ON CONFLICT ("followerId", "followingId") DO NOTHING;

INSERT INTO "public"."Follow" ("id", "followerId", "followingId", "createdAt")
SELECT fr."id" || '_to', fr."toId", fr."fromId", COALESCE(fr."respondedAt", fr."createdAt")
FROM "public"."FriendRequest" fr
WHERE fr."status" = 'ACCEPTED'
ON CONFLICT ("followerId", "followingId") DO NOTHING;

INSERT INTO "public"."Follow" ("id", "followerId", "followingId", "createdAt")
SELECT fr."id" || '_pending', fr."fromId", fr."toId", fr."createdAt"
FROM "public"."FriendRequest" fr
WHERE fr."status" = 'PENDING'
ON CONFLICT ("followerId", "followingId") DO NOTHING;

-- Cleanup legacy tables/types
DROP TABLE "public"."FriendRequest";

DROP TYPE "public"."FriendRequestStatus";
