/*
  Warnings:

  - Added the required column `academicYear` to the `Plans_tb` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planType` to the `Plans_tb` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Plans_tb` DROP FOREIGN KEY `Plans_tb_termId_fkey`;

-- DropIndex
DROP INDEX `Plans_tb_termId_fkey` ON `Plans_tb`;

-- AlterTable
ALTER TABLE `Plans_tb` ADD COLUMN `academicYear` INTEGER NOT NULL,
    ADD COLUMN `planType` ENUM('TRANSFER', 'VOCATIONAL', 'FOUR_YEAR') NOT NULL;

-- AddForeignKey
ALTER TABLE `Plans_tb` ADD CONSTRAINT `Plans_tb_termId_fkey` FOREIGN KEY (`termId`) REFERENCES `Term_tb`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
