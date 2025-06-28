/*
  Warnings:

  - You are about to drop the `TermYearConfig_tb` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `TermYearConfig_tb`;

-- CreateTable
CREATE TABLE `TermYear_tb` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `termYear` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
