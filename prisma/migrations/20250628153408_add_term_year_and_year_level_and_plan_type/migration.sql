/*
  Warnings:

  - Added the required column `planType` to the `Plans_tb` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Plans_tb` ADD COLUMN `planType` ENUM('TRANSFER', 'VOCATIONAL', 'FOUR_YEAR') NOT NULL,
    ADD COLUMN `yearLevelId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Plans_tb` ADD CONSTRAINT `Plans_tb_yearLevelId_fkey` FOREIGN KEY (`yearLevelId`) REFERENCES `YearLevel_tb`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
