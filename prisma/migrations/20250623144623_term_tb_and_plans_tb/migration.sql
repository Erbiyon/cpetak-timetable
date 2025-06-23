-- CreateTable
CREATE TABLE `Term_tb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `start` DATETIME(3) NOT NULL,
    `end` DATETIME(3) NOT NULL,

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
    `termId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Plans_tb` ADD CONSTRAINT `Plans_tb_termId_fkey` FOREIGN KEY (`termId`) REFERENCES `Term_tb`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
