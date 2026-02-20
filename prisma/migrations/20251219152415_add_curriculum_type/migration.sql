-- CreateTable
CREATE TABLE `Curriculum_tb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_sub` VARCHAR(191) NOT NULL,
    `subject_name` VARCHAR(191) NOT NULL,
    `credit` INTEGER NOT NULL,
    `lacture_credit` INTEGER NOT NULL,
    `lab_credit` INTEGER NOT NULL,
    `out_credit` INTEGER NOT NULL,
    `lacture_period` INTEGER NOT NULL,
    `lab_period` INTEGER NOT NULL,
    `out_period` INTEGER NOT NULL,
    `curriculum_type` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
