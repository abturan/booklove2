-- AlterEnum
ALTER TYPE "public"."PostStatus" ADD VALUE 'REPORTED';

-- CreateTable
CREATE TABLE "public"."PostReport" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostReport_postId_createdAt_idx" ON "public"."PostReport"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "PostReport_userId_createdAt_idx" ON "public"."PostReport"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."PostReport" ADD CONSTRAINT "PostReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostReport" ADD CONSTRAINT "PostReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
