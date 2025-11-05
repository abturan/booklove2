-- CreateTable
CREATE TABLE "public"."EventMail" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "previewText" TEXT,
    "bodyHtml" TEXT NOT NULL,
    "note" TEXT,
    "sendScope" TEXT NOT NULL DEFAULT 'ALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "EventMail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventMailRecipient" (
    "id" TEXT NOT NULL,
    "mailId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventMailRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventMailRecipient_mailId_idx" ON "public"."EventMailRecipient"("mailId");

-- CreateIndex
CREATE INDEX "EventMailRecipient_userId_idx" ON "public"."EventMailRecipient"("userId");

-- AddForeignKey
ALTER TABLE "public"."EventMail" ADD CONSTRAINT "EventMail_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."ClubEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventMail" ADD CONSTRAINT "EventMail_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventMailRecipient" ADD CONSTRAINT "EventMailRecipient_mailId_fkey" FOREIGN KEY ("mailId") REFERENCES "public"."EventMail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventMailRecipient" ADD CONSTRAINT "EventMailRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
