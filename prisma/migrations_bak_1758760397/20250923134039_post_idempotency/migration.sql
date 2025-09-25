ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "clientToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Post_clientToken_key" ON "Post"("clientToken");
