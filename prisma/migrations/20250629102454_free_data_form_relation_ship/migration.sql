/*
  Warnings:

  - You are about to drop the column `term_tbId` on the `Plans_tb` table. All the data in the column will be lost.
  - You are about to drop the column `yearLevel_tbId` on the `Plans_tb` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Plans_tb` DROP FOREIGN KEY `Plans_tb_term_tbId_fkey`;

-- DropForeignKey
ALTER TABLE `Plans_tb` DROP FOREIGN KEY `Plans_tb_yearLevel_tbId_fkey`;

-- DropIndex
DROP INDEX `Plans_tb_term_tbId_fkey` ON `Plans_tb`;

-- DropIndex
DROP INDEX `Plans_tb_yearLevel_tbId_fkey` ON `Plans_tb`;

-- AlterTable
ALTER TABLE `Plans_tb` DROP COLUMN `term_tbId`,
    DROP COLUMN `yearLevel_tbId`;
