-- CreateTable
CREATE TABLE "public"."Term_tb" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Term_tb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Plans_tb" (
    "id" SERIAL NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "credit" INTEGER NOT NULL,
    "lectureHour" INTEGER NOT NULL,
    "labHour" INTEGER NOT NULL,
    "planType" TEXT,
    "termYear" TEXT,
    "yearLevel" TEXT,
    "dep" TEXT,
    "roomId" INTEGER,
    "teacherId" INTEGER,
    "section" TEXT,

    CONSTRAINT "Plans_tb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."YearLevel_tb" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "YearLevel_tb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TermYear_tb" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "termYear" TEXT NOT NULL,

    CONSTRAINT "TermYear_tb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Room_tb" (
    "id" SERIAL NOT NULL,
    "roomCode" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "roomCate" TEXT,

    CONSTRAINT "Room_tb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Teacher_tb" (
    "id" SERIAL NOT NULL,
    "tId" TEXT NOT NULL,
    "tName" TEXT NOT NULL,
    "tLastName" TEXT NOT NULL,
    "teacherType" TEXT NOT NULL,

    CONSTRAINT "Teacher_tb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Timetable_tb" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "termYear" TEXT NOT NULL,
    "yearLevel" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "startPeriod" INTEGER NOT NULL,
    "endPeriod" INTEGER NOT NULL,
    "roomId" INTEGER,
    "teacherId" INTEGER,
    "section" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timetable_tb_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Term_tb_name_key" ON "public"."Term_tb"("name");

-- CreateIndex
CREATE INDEX "Plans_tb_section_idx" ON "public"."Plans_tb"("section");

-- CreateIndex
CREATE INDEX "Plans_tb_roomId_idx" ON "public"."Plans_tb"("roomId");

-- CreateIndex
CREATE INDEX "Plans_tb_teacherId_idx" ON "public"."Plans_tb"("teacherId");

-- CreateIndex
CREATE INDEX "Timetable_tb_day_startPeriod_endPeriod_idx" ON "public"."Timetable_tb"("day", "startPeriod", "endPeriod");

-- CreateIndex
CREATE INDEX "Timetable_tb_roomId_idx" ON "public"."Timetable_tb"("roomId");

-- CreateIndex
CREATE INDEX "Timetable_tb_teacherId_idx" ON "public"."Timetable_tb"("teacherId");

-- CreateIndex
CREATE INDEX "Timetable_tb_planId_idx" ON "public"."Timetable_tb"("planId");

-- AddForeignKey
ALTER TABLE "public"."Plans_tb" ADD CONSTRAINT "Plans_tb_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room_tb"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Plans_tb" ADD CONSTRAINT "Plans_tb_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher_tb"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Timetable_tb" ADD CONSTRAINT "Timetable_tb_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."Plans_tb"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Timetable_tb" ADD CONSTRAINT "Timetable_tb_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room_tb"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Timetable_tb" ADD CONSTRAINT "Timetable_tb_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher_tb"("id") ON DELETE SET NULL ON UPDATE CASCADE;
