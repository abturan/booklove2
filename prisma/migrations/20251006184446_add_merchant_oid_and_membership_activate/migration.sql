/*
  Warnings:

  - Made the column `merchantOid` on table `PaymentIntent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."PaymentIntent" ALTER COLUMN "merchantOid" SET NOT NULL;

-- CreateIndex
CREATE INDEX "PaymentIntent_createdAt_idx" ON "public"."PaymentIntent"("createdAt");
