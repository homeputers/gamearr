-- DropForeignKey
ALTER TABLE "DatEntry" DROP CONSTRAINT "DatEntry_dat_file_id_fkey";

-- AddForeignKey
ALTER TABLE "DatEntry" ADD CONSTRAINT "DatEntry_dat_file_id_fkey" FOREIGN KEY ("dat_file_id") REFERENCES "DatFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
