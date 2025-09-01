-- Ensure Platform array fields are required
UPDATE "Platform" SET "extensions" = ARRAY[]::TEXT[] WHERE "extensions" IS NULL;
UPDATE "Platform" SET "aliases" = ARRAY[]::TEXT[] WHERE "aliases" IS NULL;
ALTER TABLE "Platform" ALTER COLUMN "extensions" SET NOT NULL;
ALTER TABLE "Platform" ALTER COLUMN "aliases" SET NOT NULL;
