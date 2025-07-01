-- AlterTable
ALTER TABLE `Plans_tb` ADD COLUMN `roomId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Plans_tb` ADD CONSTRAINT `Plans_tb_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room_tb`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
