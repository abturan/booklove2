-- CreateEnum
CREATE TYPE "public"."PostStatus" AS ENUM ('PUBLISHED', 'PENDING', 'HIDDEN');

-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "status" "public"."PostStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Post_status_createdAt_idx" ON "public"."Post"("status", "createdAt");
