/*
  Warnings:

  - You are about to drop the column `lab_period` on the `Curriculum_tb` table. All the data in the column will be lost.
  - You are about to drop the column `lacture_period` on the `Curriculum_tb` table. All the data in the column will be lost.
  - You are about to drop the column `out_period` on the `Curriculum_tb` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Curriculum_tb` DROP COLUMN `lab_period`,
    DROP COLUMN `lacture_period`,
    DROP COLUMN `out_period`;
