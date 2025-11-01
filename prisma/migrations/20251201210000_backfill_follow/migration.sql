DO $$
BEGIN
  IF to_regclass('"public"."FriendRequest"') IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO "public"."Follow" ("id", "followerId", "followingId", "createdAt")
  SELECT CONCAT(fr."id", '_from'), fr."fromId", fr."toId", COALESCE(fr."respondedAt", fr."createdAt")
  FROM "public"."FriendRequest" fr
  WHERE fr."status" = 'ACCEPTED'
  ON CONFLICT ("followerId", "followingId") DO NOTHING;

  INSERT INTO "public"."Follow" ("id", "followerId", "followingId", "createdAt")
  SELECT CONCAT(fr."id", '_to'), fr."toId", fr."fromId", COALESCE(fr."respondedAt", fr."createdAt")
  FROM "public"."FriendRequest" fr
  WHERE fr."status" = 'ACCEPTED'
  ON CONFLICT ("followerId", "followingId") DO NOTHING;

  INSERT INTO "public"."Follow" ("id", "followerId", "followingId", "createdAt")
  SELECT CONCAT(fr."id", '_pending'), fr."fromId", fr."toId", fr."createdAt"
  FROM "public"."FriendRequest" fr
  WHERE fr."status" = 'PENDING'
  ON CONFLICT ("followerId", "followingId") DO NOTHING;
END $$;
