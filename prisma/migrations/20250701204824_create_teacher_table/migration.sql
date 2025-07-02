-- CreateTable
CREATE TABLE `Teacher_tb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tId` VARCHAR(191) NOT NULL,
    `tName` VARCHAR(191) NOT NULL,
    `tLastName` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
