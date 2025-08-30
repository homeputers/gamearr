-- AlterTable
ALTER TABLE "DatEntry" ADD COLUMN "dat_file_id" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DatEntry" ADD COLUMN "hash_md5" TEXT;
ALTER TABLE "DatEntry" ADD COLUMN "revision" TEXT;
ALTER TABLE "DatEntry" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "DatEntry" ALTER COLUMN "languages" SET DATA TYPE TEXT[] USING CASE WHEN "languages" IS NULL OR "languages" = '' THEN ARRAY[]::TEXT[] ELSE string_to_array("languages", ',') END;
ALTER TABLE "DatEntry" ALTER COLUMN "source" SET DEFAULT 'unknown';

-- CreateIndex
CREATE INDEX "DatEntry_hash_md5_idx" ON "DatEntry"("hash_md5");

-- CreateTable relation
ALTER TABLE "DatEntry" ADD CONSTRAINT "DatEntry_dat_file_id_fkey" FOREIGN KEY ("dat_file_id") REFERENCES "DatFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateUniqueIndex
CREATE UNIQUE INDEX "DatEntry_dat_file_id_canonical_name_key" ON "DatEntry"("dat_file_id", "canonical_name");

-- RemoveDefault
ALTER TABLE "DatEntry" ALTER COLUMN "dat_file_id" DROP DEFAULT;
