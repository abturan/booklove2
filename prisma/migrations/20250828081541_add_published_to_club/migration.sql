-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Club" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Türkiye',
    "city" TEXT,
    "bannerUrl" TEXT,
    "priceTRY" INTEGER NOT NULL DEFAULT 49,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "moderatorId" TEXT NOT NULL,
    CONSTRAINT "Club_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Club" ("bannerUrl", "city", "country", "createdAt", "description", "id", "moderatorId", "name", "priceTRY", "slug", "updatedAt") SELECT "bannerUrl", "city", "country", "createdAt", "description", "id", "moderatorId", "name", "priceTRY", "slug", "updatedAt" FROM "Club";
DROP TABLE "Club";
ALTER TABLE "new_Club" RENAME TO "Club";
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");
CREATE UNIQUE INDEX "Club_moderatorId_key" ON "Club"("moderatorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
