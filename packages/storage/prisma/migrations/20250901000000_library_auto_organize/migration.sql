-- AlterTable
ALTER TABLE "Library" ADD COLUMN "autoOrganizeOnImport" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Library" ADD COLUMN "lastScannedAt" TIMESTAMP(3);
