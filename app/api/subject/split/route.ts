import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { subjectId, splitData } = await request.json();

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!subjectId || !splitData || !splitData.part1 || !splitData.part2) {
            return NextResponse.json(
                { error: "Missing required data" },
                { status: 400 }
            );
        }

        // ใช้ transaction เพื่อให้การทำงานทั้งหมดเป็น atomic operation
        const result = await prisma.$transaction(async (tx) => {
            // 1. ดึงข้อมูลวิชาที่จะแบ่ง
            const subjectToSplit = await tx.plans_tb.findUnique({
                where: { id: subjectId },
                include: {
                    timetables: true, // ดึงข้อมูลตารางเวลาด้วย
                }
            });

            if (!subjectToSplit) {
                throw new Error("Subject not found");
            }

            // 2. ดึงชื่อวิชาเดิมออกมา (ตัด "(ส่วนที่ X)" ออก ถ้ามี)
            const baseSubjectName = subjectToSplit.subjectName.replace(/\s*\(ส่วนที่ \d+\)\s*$/, '');

            // 3. สร้างชื่อใหม่สำหรับทั้งสองส่วน
            const part1Name = `${baseSubjectName} (ส่วนที่ ${splitData.part1.partNumber})`;
            const part2Name = `${baseSubjectName} (ส่วนที่ ${splitData.part2.partNumber})`;

            // 4. อัปเดตวิชาเดิมเป็นส่วนที่ 1
            const updatedSubject = await tx.plans_tb.update({
                where: { id: subjectId },
                data: {
                    subjectName: part1Name,
                    lectureHour: splitData.part1.lectureHour,
                    labHour: splitData.part1.labHour
                }
            });

            // 5. สร้างวิชาใหม่เป็นส่วนที่ 2
            const newSubject = await tx.plans_tb.create({
                data: {
                    subjectCode: subjectToSplit.subjectCode,
                    subjectName: part2Name,
                    credit: subjectToSplit.credit,
                    lectureHour: splitData.part2.lectureHour,
                    labHour: splitData.part2.labHour,
                    termYear: subjectToSplit.termYear,
                    yearLevel: subjectToSplit.yearLevel,
                    planType: subjectToSplit.planType,
                    dep: subjectToSplit.dep,
                    roomId: subjectToSplit.roomId,
                    teacherId: subjectToSplit.teacherId,
                    section: subjectToSplit.section
                }
            });

            // 6. ลบข้อมูลตารางเดิมที่อาจมีอยู่
            if (subjectToSplit.timetables && subjectToSplit.timetables.length > 0) {
                await tx.timetable_tb.deleteMany({
                    where: { planId: subjectId }
                });
            }

            return { updatedSubject, newSubject };
        });

        // ส่งข้อมูลวิชาทั้งสองส่วนกลับไป
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Error in split API:", error);
        return NextResponse.json(
            { error: error.message || "Failed to split subject" },
            { status: 500 }
        );
    }
}