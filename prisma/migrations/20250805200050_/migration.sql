/*
  Warnings:

  - You are about to drop the column `roomCath` on the `Room_tb` table. All the data in the column will be lost.
  - You are about to drop the column `roomTset` on the `Room_tb` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Room_tb` DROP COLUMN `roomCath`,
    DROP COLUMN `roomTset`;
