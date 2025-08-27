-- CreateTable
CREATE TABLE "DatEntry" (
    "id" TEXT NOT NULL,
    "hash_crc" TEXT,
    "hash_sha1" TEXT,
    "canonical_name" TEXT NOT NULL,
    "region" TEXT,
    "languages" TEXT,
    "serial" TEXT,
    "source" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    CONSTRAINT "DatEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DatEntry_hash_crc_idx" ON "DatEntry"("hash_crc");
CREATE INDEX "DatEntry_hash_sha1_idx" ON "DatEntry"("hash_sha1");

-- AddForeignKey
ALTER TABLE "DatEntry" ADD CONSTRAINT "DatEntry_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
