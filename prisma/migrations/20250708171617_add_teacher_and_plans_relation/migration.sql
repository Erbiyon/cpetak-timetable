-- AlterTable
ALTER TABLE `Plans_tb` ADD COLUMN `teacherId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Plans_tb` ADD CONSTRAINT `Plans_tb_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher_tb`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
