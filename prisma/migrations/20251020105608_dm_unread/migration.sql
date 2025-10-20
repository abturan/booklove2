-- CreateTable
CREATE TABLE "public"."DmThreadRead" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DmThreadRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DmThreadRead_userId_idx" ON "public"."DmThreadRead"("userId");

-- CreateIndex
CREATE INDEX "DmThreadRead_threadId_lastReadAt_idx" ON "public"."DmThreadRead"("threadId", "lastReadAt");

-- CreateIndex
CREATE UNIQUE INDEX "DmThreadRead_threadId_userId_key" ON "public"."DmThreadRead"("threadId", "userId");

-- AddForeignKey
ALTER TABLE "public"."DmThreadRead" ADD CONSTRAINT "DmThreadRead_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."DmThread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DmThreadRead" ADD CONSTRAINT "DmThreadRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
