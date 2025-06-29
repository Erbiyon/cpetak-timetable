/*
  Warnings:

  - You are about to alter the column `planType` on the `Plans_tb` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `Plans_tb` MODIFY `planType` VARCHAR(191) NOT NULL;
