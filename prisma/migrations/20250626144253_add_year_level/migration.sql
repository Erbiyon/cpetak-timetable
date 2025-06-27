/*
  Warnings:

  - Added the required column `yearLevelId` to the `Plans_tb` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Plans_tb` ADD COLUMN `yearLevelId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `YearLevel_tb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Plans_tb` ADD CONSTRAINT `Plans_tb_yearLevelId_fkey` FOREIGN KEY (`yearLevelId`) REFERENCES `YearLevel_tb`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
