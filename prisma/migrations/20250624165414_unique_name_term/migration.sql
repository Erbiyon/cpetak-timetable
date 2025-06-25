/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Term_tb` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Term_tb_name_key` ON `Term_tb`(`name`);
