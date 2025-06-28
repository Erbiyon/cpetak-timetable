/*
  Warnings:

  - You are about to drop the column `yearLevelId` on the `Plans_tb` table. All the data in the column will be lost.
  - Added the required column `termYear` to the `Plans_tb` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yearLevel` to the `Plans_tb` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Plans_tb` DROP FOREIGN KEY `Plans_tb_yearLevelId_fkey`;

-- DropIndex
DROP INDEX `Plans_tb_yearLevelId_fkey` ON `Plans_tb`;

-- AlterTable
ALTER TABLE `Plans_tb` DROP COLUMN `yearLevelId`,
    ADD COLUMN `termYear` VARCHAR(191) NOT NULL,
    ADD COLUMN `yearLevel` VARCHAR(191) NOT NULL,
    ADD COLUMN `yearLevel_tbId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Plans_tb` ADD CONSTRAINT `Plans_tb_yearLevel_tbId_fkey` FOREIGN KEY (`yearLevel_tbId`) REFERENCES `YearLevel_tb`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
