-- DropForeignKey
ALTER TABLE "public"."ChatRoom" DROP CONSTRAINT "ChatRoom_clubEventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChatRoom" DROP CONSTRAINT "ChatRoom_clubId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Membership" DROP CONSTRAINT "Membership_clubEventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentIntent" DROP CONSTRAINT "PaymentIntent_clubEventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Subscription" DROP CONSTRAINT "Subscription_clubEventId_fkey";

-- DropIndex
DROP INDEX "public"."Membership_clubEventId_idx";

-- DropIndex
DROP INDEX "public"."PaymentIntent_clubEventId_idx";

-- DropIndex
DROP INDEX "public"."Subscription_clubEventId_idx";

-- AlterTable
ALTER TABLE "public"."ChatRoom" ALTER COLUMN "clubId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_clubEventId_fkey" FOREIGN KEY ("clubEventId") REFERENCES "public"."ClubEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_clubEventId_fkey" FOREIGN KEY ("clubEventId") REFERENCES "public"."ClubEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentIntent" ADD CONSTRAINT "PaymentIntent_clubEventId_fkey" FOREIGN KEY ("clubEventId") REFERENCES "public"."ClubEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "public"."Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_clubEventId_fkey" FOREIGN KEY ("clubEventId") REFERENCES "public"."ClubEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
