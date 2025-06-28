/*
  Warnings:

  - You are about to drop the column `academicYear` on the `Plans_tb` table. All the data in the column will be lost.
  - You are about to drop the column `planType` on the `Plans_tb` table. All the data in the column will be lost.
  - You are about to drop the column `termId` on the `Plans_tb` table. All the data in the column will be lost.
  - You are about to drop the column `yearLevelId` on the `Plans_tb` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Plans_tb` DROP FOREIGN KEY `Plans_tb_termId_fkey`;

-- DropForeignKey
ALTER TABLE `Plans_tb` DROP FOREIGN KEY `Plans_tb_yearLevelId_fkey`;

-- DropIndex
DROP INDEX `Plans_tb_termId_fkey` ON `Plans_tb`;

-- DropIndex
DROP INDEX `Plans_tb_yearLevelId_fkey` ON `Plans_tb`;

-- AlterTable
ALTER TABLE `Plans_tb` DROP COLUMN `academicYear`,
    DROP COLUMN `planType`,
    DROP COLUMN `termId`,
    DROP COLUMN `yearLevelId`,
    ADD COLUMN `term_tbId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Plans_tb` ADD CONSTRAINT `Plans_tb_term_tbId_fkey` FOREIGN KEY (`term_tbId`) REFERENCES `Term_tb`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
