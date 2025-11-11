-- DropIndex
DROP INDEX "public"."Club_moderatorId_key";

-- AlterTable
ALTER TABLE "public"."Club" ADD COLUMN     "conferenceEnabled" BOOLEAN NOT NULL DEFAULT false;
