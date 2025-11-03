-- CreateTable
CREATE TABLE "public"."DmReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DmReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DmReaction_messageId_idx" ON "public"."DmReaction"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "DmReaction_messageId_userId_emoji_key" ON "public"."DmReaction"("messageId", "userId", "emoji");

-- AddForeignKey
ALTER TABLE "public"."DmReaction" ADD CONSTRAINT "DmReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."DmMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DmReaction" ADD CONSTRAINT "DmReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
