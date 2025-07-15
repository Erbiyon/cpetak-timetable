-- CreateTable
CREATE TABLE `Timetable_tb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `planId` INTEGER NOT NULL,
    `termYear` VARCHAR(191) NOT NULL,
    `yearLevel` VARCHAR(191) NOT NULL,
    `planType` VARCHAR(191) NOT NULL,
    `day` INTEGER NOT NULL,
    `startPeriod` INTEGER NOT NULL,
    `endPeriod` INTEGER NOT NULL,
    `roomId` INTEGER NULL,
    `teacherId` INTEGER NULL,
    `section` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Timetable_tb_day_startPeriod_endPeriod_idx`(`day`, `startPeriod`, `endPeriod`),
    INDEX `Timetable_tb_roomId_idx`(`roomId`),
    INDEX `Timetable_tb_teacherId_idx`(`teacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Timetable_tb` ADD CONSTRAINT `Timetable_tb_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plans_tb`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Timetable_tb` ADD CONSTRAINT `Timetable_tb_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room_tb`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Timetable_tb` ADD CONSTRAINT `Timetable_tb_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher_tb`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
