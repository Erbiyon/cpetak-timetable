/*
  Warnings:

  - Added the required column `roomCath` to the `Room_tb` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Room_tb` ADD COLUMN `roomCath` VARCHAR(191) NOT NULL;
