CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure new pricing and capacity columns exist for events
ALTER TABLE "ClubEvent"
  ADD COLUMN IF NOT EXISTS "priceTRY" INTEGER,
  ADD COLUMN IF NOT EXISTS "capacity" INTEGER;

WITH pick_source AS (
  SELECT
    cp.id,
    cp."clubId",
    cp."monthKey",
    cp."note",
    b.title        AS book_title,
    b.author       AS book_author,
    b.translator   AS book_translator,
    b.pages        AS book_pages,
    b.isbn         AS book_isbn,
    b."coverUrl"   AS book_cover,
    (cp."monthKey" || '-01')::date AS month_start
  FROM "ClubPick" cp
  LEFT JOIN "Book" b ON b.id = cp."bookId"
),
updated AS (
  UPDATE "ClubEvent" ce
  SET
    "bookTitle" = COALESCE(ce."bookTitle", ps.book_title),
    "bookAuthor" = COALESCE(ce."bookAuthor", ps.book_author),
    "bookTranslator" = COALESCE(ce."bookTranslator", ps.book_translator),
    "bookPages" = COALESCE(ce."bookPages", ps.book_pages),
    "bookIsbn" = COALESCE(ce."bookIsbn", ps.book_isbn),
    "bookCoverUrl" = COALESCE(ce."bookCoverUrl", ps.book_cover),
    "notes" = CASE
      WHEN ce."notes" IS NULL OR ce."notes" = '' THEN ps.note
      ELSE ce."notes"
    END
  FROM pick_source ps
  WHERE ce."clubId" = ps."clubId"
    AND date_trunc('month', ce."startsAt") = date_trunc('month', ps.month_start)
  RETURNING ps.id
),
missing AS (
  SELECT
    ps.id,
    ps."clubId",
    ps.month_start,
    ps.note,
    ps.book_title,
    ps.book_author,
    ps.book_translator,
    ps.book_pages,
    ps.book_isbn,
    ps.book_cover
  FROM pick_source ps
  WHERE NOT EXISTS (
    SELECT 1
    FROM "ClubEvent" ce
    WHERE ce."clubId" = ps."clubId"
      AND date_trunc('month', ce."startsAt") = date_trunc('month', ps.month_start)
  )
)
INSERT INTO "ClubEvent" (
  "id",
  "clubId",
  "startsAt",
  "title",
  "notes",
  "bookTitle",
  "bookAuthor",
  "bookTranslator",
  "bookPages",
  "bookIsbn",
  "bookCoverUrl",
  "priceTRY",
  "capacity"
)
SELECT
  uuid_generate_v4(),
  m."clubId",
  (m.month_start + INTERVAL '20 hours')::timestamp,
  CONCAT(to_char(m.month_start, 'YYYY-MM'), ' Oturumu'),
  m.note,
  m.book_title,
  m.book_author,
  m.book_translator,
  m.book_pages,
  m.book_isbn,
  m.book_cover,
  c."priceTRY",
  c."capacity"
FROM missing m
JOIN "Club" c ON c.id = m."clubId";

DROP TABLE IF EXISTS "ClubPick";
DROP TABLE IF EXISTS "Book";
