/*
  Warnings:

  - A unique constraint covering the columns `[merchantOid]` on the table `PaymentIntent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."PaymentIntent" ADD COLUMN     "merchantOid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_merchantOid_key" ON "public"."PaymentIntent"("merchantOid");

-- CreateIndex
CREATE INDEX "PaymentIntent_merchantOid_idx" ON "public"."PaymentIntent"("merchantOid");
