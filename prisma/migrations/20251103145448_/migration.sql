-- CreateTable
CREATE TABLE "public"."Meeting" (
    "id" TEXT NOT NULL,
    "clubEventId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "opensAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MeetingPresence" (
    "id" TEXT NOT NULL,
    "clubEventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "handRaisedAt" TIMESTAMP(3),
    "allowSpeak" BOOLEAN NOT NULL DEFAULT false,
    "micOn" BOOLEAN NOT NULL DEFAULT false,
    "cameraOn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MeetingPresence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventReminder" (
    "id" TEXT NOT NULL,
    "clubEventId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_clubEventId_key" ON "public"."Meeting"("clubEventId");

-- CreateIndex
CREATE INDEX "MeetingPresence_clubEventId_idx" ON "public"."MeetingPresence"("clubEventId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingPresence_clubEventId_userId_key" ON "public"."MeetingPresence"("clubEventId", "userId");

-- CreateIndex
CREATE INDEX "EventReminder_clubEventId_idx" ON "public"."EventReminder"("clubEventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventReminder_clubEventId_kind_key" ON "public"."EventReminder"("clubEventId", "kind");

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_clubEventId_fkey" FOREIGN KEY ("clubEventId") REFERENCES "public"."ClubEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeetingPresence" ADD CONSTRAINT "MeetingPresence_clubEventId_fkey" FOREIGN KEY ("clubEventId") REFERENCES "public"."ClubEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeetingPresence" ADD CONSTRAINT "MeetingPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventReminder" ADD CONSTRAINT "EventReminder_clubEventId_fkey" FOREIGN KEY ("clubEventId") REFERENCES "public"."ClubEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
