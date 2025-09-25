/*
  Warnings:

  - You are about to drop the column `clientToken` on the `DmMessage` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `DmThread` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessageAt` on the `DmThread` table. All the data in the column will be lost.
  - You are about to drop the column `u1Id` on the `DmThread` table. All the data in the column will be lost.
  - You are about to drop the column `u2Id` on the `DmThread` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userAId,userBId]` on the table `DmThread` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userAId` to the `DmThread` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userBId` to the `DmThread` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."DmMessage_clientToken_key";

-- DropIndex
DROP INDEX "public"."DmThread_lastMessageAt_idx";

-- DropIndex
DROP INDEX "public"."DmThread_u1Id_u2Id_key";

-- AlterTable
ALTER TABLE "public"."DmMessage" DROP COLUMN "clientToken";

-- AlterTable
ALTER TABLE "public"."DmThread" DROP COLUMN "createdAt",
DROP COLUMN "lastMessageAt",
DROP COLUMN "u1Id",
DROP COLUMN "u2Id",
ADD COLUMN     "lastMessage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userAId" TEXT NOT NULL,
ADD COLUMN     "userBId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "DmThread_lastMessage_idx" ON "public"."DmThread"("lastMessage");

-- CreateIndex
CREATE UNIQUE INDEX "DmThread_userAId_userBId_key" ON "public"."DmThread"("userAId", "userBId");

-- AddForeignKey
ALTER TABLE "public"."DmThread" ADD CONSTRAINT "DmThread_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "public"."DmThread" ADD CONSTRAINT "DmThread_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

