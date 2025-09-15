-- CreateTable
CREATE TABLE `Term_tb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `start` DATETIME(3) NOT NULL,
    `end` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Term_tb_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Plans_tb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subjectCode` VARCHAR(191) NOT NULL,
    `subjectName` VARCHAR(191) NOT NULL,
    `credit` INTEGER NOT NULL,
    `lectureHour` INTEGER NOT NULL,
    `labHour` INTEGER NOT NULL,
    `planType` VARCHAR(191) NULL,
    `termYear` VARCHAR(191) NULL,
    `yearLevel` VARCHAR(191) NULL,
    `dep` VARCHAR(191) NULL,
    `roomId` INTEGER NULL,
    `teacherId` INTEGER NULL,
    `section` VARCHAR(191) NULL,

    INDEX `Plans_tb_section_idx`(`section`),
    INDEX `Plans_tb_roomId_idx`(`roomId`),
    INDEX `Plans_tb_teacherId_idx`(`teacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `YearLevel_tb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TermYear_tb` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `termYear` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Room_tb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomCode` VARCHAR(191) NOT NULL,
    `roomType` VARCHAR(191) NOT NULL,
    `roomCate` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Teacher_tb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tId` VARCHAR(191) NOT NULL,
    `tName` VARCHAR(191) NOT NULL,
    `tLastName` VARCHAR(191) NOT NULL,
    `teacherType` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    INDEX `Timetable_tb_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CoTeaching_tb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupKey` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `CoTeaching_tb_groupKey_key`(`groupKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CoTeachingPlans` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CoTeachingPlans_AB_unique`(`A`, `B`),
    INDEX `_CoTeachingPlans_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Plans_tb` ADD CONSTRAINT `Plans_tb_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room_tb`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Plans_tb` ADD CONSTRAINT `Plans_tb_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher_tb`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Timetable_tb` ADD CONSTRAINT `Timetable_tb_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plans_tb`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Timetable_tb` ADD CONSTRAINT `Timetable_tb_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room_tb`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Timetable_tb` ADD CONSTRAINT `Timetable_tb_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher_tb`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CoTeachingPlans` ADD CONSTRAINT `_CoTeachingPlans_A_fkey` FOREIGN KEY (`A`) REFERENCES `CoTeaching_tb`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CoTeachingPlans` ADD CONSTRAINT `_CoTeachingPlans_B_fkey` FOREIGN KEY (`B`) REFERENCES `Plans_tb`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
