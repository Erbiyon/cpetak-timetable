-- AlterTable
ALTER TABLE `Teacher_tb` ADD COLUMN `isEnrolled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `passwordHash` VARCHAR(191) NULL,
    ADD COLUMN `sessionVersion` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `TeacherToken_tb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` INTEGER NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `tokenType` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TeacherToken_tb_tokenHash_key`(`tokenHash`),
    INDEX `TeacherToken_tb_tokenHash_idx`(`tokenHash`),
    INDEX `TeacherToken_tb_teacherId_idx`(`teacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TeacherToken_tb` ADD CONSTRAINT `TeacherToken_tb_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher_tb`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

