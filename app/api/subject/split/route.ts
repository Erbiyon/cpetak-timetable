import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ถ้ามี dynamic route ให้แก้ไขแบบเดียวกัน
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id?: string }> } // ถ้ามี params
) {
    try {
        // ถ้ามี params ให้ await
        // const resolvedParams = await params;

        const { subjectId, splitData } = await request.json()

        // ค้นหาวิชาต้นฉบับ
        const originalSubject = await prisma.plans_tb.findUnique({
            where: { id: subjectId },
            include: {
                room: true,
                teacher: true
            }
        })

        if (!originalSubject) {
            return NextResponse.json({ error: "ไม่พบวิชาที่ระบุ" }, { status: 404 })
        }

        console.log("Original subject data:", {
            id: originalSubject.id,
            roomId: originalSubject.roomId,
            teacherId: originalSubject.teacherId,
            section: originalSubject.section,
            room: originalSubject.room,
            teacher: originalSubject.teacher
        })

        // ดึงชื่อวิชาเดิม (ตัด "(ส่วนที่ X)" ออกถ้ามี)
        const baseSubjectName = originalSubject.subjectName.replace(/\s*\(ส่วนที่ \d+\)\s*$/, '')

        // หาเลขส่วนปัจจุบัน
        const currentPartMatch = originalSubject.subjectName.match(/\(ส่วนที่ (\d+)\)$/)
        const currentPartNumber = currentPartMatch ? parseInt(currentPartMatch[1], 10) : 1

        // คำนวณ section ใหม่
        const originalSection = originalSubject.section || "1"; // ถ้าไม่มี section ให้เป็น "1"
        const newSection1 = `${originalSection}-1`;
        const newSection2 = `${originalSection}-2`;

        console.log("Section calculation:", {
            originalSection,
            newSection1,
            newSection2
        });

        const { part1, part2 } = splitData

        // ลบข้อมูลตารางเรียนเดิมก่อน (ถ้ามี)
        await prisma.timetable_tb.deleteMany({
            where: { planId: subjectId }
        })

        // อัปเดตวิชาส่วนแรก - ใช้ section ใหม่
        const updatedSubject = await prisma.plans_tb.update({
            where: { id: subjectId },
            data: {
                subjectName: `${baseSubjectName} (ส่วนที่ ${part1.partNumber})`,
                lectureHour: part1.lectureHour,
                labHour: part1.labHour,
                // *** คงข้อมูลเดิม แต่เปลี่ยน section ***
                roomId: originalSubject.roomId,
                teacherId: originalSubject.teacherId,
                section: newSection1
            },
            include: {
                room: true,
                teacher: true
            }
        })

        // สร้างวิชาส่วนที่สอง - ใช้ section ใหม่
        const newSubject = await prisma.plans_tb.create({
            data: {
                subjectCode: originalSubject.subjectCode,
                subjectName: `${baseSubjectName} (ส่วนที่ ${part2.partNumber})`,
                credit: originalSubject.credit,
                lectureHour: part2.lectureHour,
                labHour: part2.labHour,
                termYear: originalSubject.termYear,
                yearLevel: originalSubject.yearLevel,
                planType: originalSubject.planType,
                dep: originalSubject.dep,
                // *** คัดลอกข้อมูลจากวิชาเดิม แต่ใช้ section ใหม่ ***
                roomId: originalSubject.roomId,
                teacherId: originalSubject.teacherId,
                section: newSection2
            },
            include: {
                room: true,
                teacher: true
            }
        })

        console.log("Split results:", {
            updated: {
                id: updatedSubject.id,
                name: updatedSubject.subjectName,
                roomId: updatedSubject.roomId,
                teacherId: updatedSubject.teacherId,
                section: updatedSubject.section
            },
            new: {
                id: newSubject.id,
                name: newSubject.subjectName,
                roomId: newSubject.roomId,
                teacherId: newSubject.teacherId,
                section: newSubject.section
            }
        })

        return NextResponse.json({
            success: true,
            updatedSubject,
            newSubject
        })

    } catch (error) {
        console.error("Error splitting subject:", error)
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการแบ่งวิชา" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}