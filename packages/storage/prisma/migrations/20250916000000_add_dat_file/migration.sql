-- AlterTable
ALTER TABLE "Platform" ADD COLUMN     "activeDatFileId" TEXT;

-- CreateTable
CREATE TABLE "DatFile" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "sha256" TEXT NOT NULL,
    "source" TEXT,
    "version" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "DatFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatFile_path_key" ON "DatFile"("path");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_activeDatFileId_key" ON "Platform"("activeDatFileId");

-- AddForeignKey
ALTER TABLE "Platform" ADD CONSTRAINT "Platform_activeDatFileId_fkey" FOREIGN KEY ("activeDatFileId") REFERENCES "DatFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatFile" ADD CONSTRAINT "DatFile_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

