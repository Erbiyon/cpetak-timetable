/*
  Warnings:

  - Made the column `roomCath` on table `Room_tb` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Room_tb` MODIFY `roomCath` VARCHAR(191) NOT NULL;
