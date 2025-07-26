/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Timetable_tb` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Timetable_tb` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Timetable_tb` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`;
