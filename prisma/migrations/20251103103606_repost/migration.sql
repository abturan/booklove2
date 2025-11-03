-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "repostOfId" TEXT;

-- CreateIndex
CREATE INDEX "Post_repostOfId_idx" ON "public"."Post"("repostOfId");

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_repostOfId_fkey" FOREIGN KEY ("repostOfId") REFERENCES "public"."Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
