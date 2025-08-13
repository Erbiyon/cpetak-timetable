import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id?: string }> } // ถ้ามี params
) {
    try {
        // ถ้ามี params ให้ await
        // const resolvedParams = await params;

        const { subjectId } = await request.json()

        // ค้นหาวิชาที่ต้องการรวม
        const subjectToMerge = await prisma.plans_tb.findUnique({
            where: { id: subjectId },
            include: {
                room: true,
                teacher: true
            }
        })

        if (!subjectToMerge) {
            return NextResponse.json({ error: "ไม่พบวิชาที่ระบุ" }, { status: 404 })
        }

        // ดึงชื่อวิชาเดิม (ตัด "(ส่วนที่ X)" ออก)
        const baseSubjectName = subjectToMerge.subjectName.replace(/\s*\(ส่วนที่ \d+\)\s*$/, '')
        const subjectCode = subjectToMerge.subjectCode

        // ค้นหาวิชาทั้งหมดที่มีชื่อเดียวกันและมี "(ส่วนที่ X)"
        const allParts = await prisma.plans_tb.findMany({
            where: {
                subjectCode: subjectCode,
                subjectName: {
                    contains: baseSubjectName
                },
                termYear: subjectToMerge.termYear,
                yearLevel: subjectToMerge.yearLevel,
                planType: subjectToMerge.planType
            },
            include: {
                room: true,
                teacher: true
            }
        })

        // กรองเฉพาะส่วนที่แบ่ง
        const splitParts = allParts.filter(part =>
            part.subjectName.includes('(ส่วนที่')
        )

        if (splitParts.length < 2) {
            return NextResponse.json({ error: "ไม่พบส่วนที่แบ่งเพื่อรวม" }, { status: 400 })
        }

        console.log("All parts found:", splitParts.map(p => ({
            id: p.id,
            name: p.subjectName,
            roomId: p.roomId,
            teacherId: p.teacherId,
            section: p.section,
            lectureHour: p.lectureHour,
            labHour: p.labHour
        })));

        // คำนวณชั่วโมงรวม
        const totalLectureHours = splitParts.reduce((sum, part) => sum + (part.lectureHour || 0), 0)
        const totalLabHours = splitParts.reduce((sum, part) => sum + (part.labHour || 0), 0)

        // คำนวณ section เดิมจากส่วนที่แบ่ง
        // หาส่วนที่มี section แบบ "x-1" หรือ "x-2" แล้วดึง x กลับมา
        let originalSection = null;
        for (const part of splitParts) {
            if (part.section) {
                // ตรวจสอบว่าเป็นรูปแบบ "x-1", "x-2" หรือไม่
                const sectionMatch = part.section.match(/^(.+)-\d+$/);
                if (sectionMatch) {
                    originalSection = sectionMatch[1]; // ได้ "x"
                    break;
                } else {
                    // ถ้าไม่ใช่รูปแบบ "x-y" ให้ใช้ section เดิม
                    originalSection = part.section;
                    break;
                }
            }
        }

        console.log("Original section calculation:", {
            splitParts: splitParts.map(p => ({ id: p.id, section: p.section })),
            originalSection
        });

        // เลือกข้อมูล room, teacher จากส่วนแรกที่มีข้อมูล
        let mergedRoomId = null;
        let mergedTeacherId = null;

        for (const part of splitParts) {
            if (!mergedRoomId && part.roomId) mergedRoomId = part.roomId;
            if (!mergedTeacherId && part.teacherId) mergedTeacherId = part.teacherId;
        }

        console.log("Merged data will be:", {
            roomId: mergedRoomId,
            teacherId: mergedTeacherId,
            section: originalSection,
            lectureHour: totalLectureHours,
            labHour: totalLabHours
        });

        // ลบตารางเรียนของส่วนที่แบ่งทั้งหมด
        await prisma.timetable_tb.deleteMany({
            where: {
                planId: {
                    in: splitParts.map(part => part.id)
                }
            }
        })

        // รวมกลับเป็นวิชาเดิม - อัปเดตส่วนแรก
        const mergedSubject = await prisma.plans_tb.update({
            where: { id: splitParts[0].id },
            data: {
                subjectName: baseSubjectName, // ลบ "(ส่วนที่ X)" ออก
                lectureHour: totalLectureHours,
                labHour: totalLabHours,
                roomId: mergedRoomId,
                teacherId: mergedTeacherId,
                section: originalSection
            },
            include: {
                room: true,
                teacher: true
            }
        })

        // ลบส่วนอื่นๆ
        const partsToDelete = splitParts.slice(1).map(part => part.id)
        if (partsToDelete.length > 0) {
            await prisma.plans_tb.deleteMany({
                where: {
                    id: {
                        in: partsToDelete
                    }
                }
            })
        }

        console.log("Merge completed:", {
            mergedSubject: {
                id: mergedSubject.id,
                name: mergedSubject.subjectName,
                roomId: mergedSubject.roomId,
                teacherId: mergedSubject.teacherId,
                section: mergedSubject.section
            },
            deletedParts: partsToDelete
        });

        return NextResponse.json({
            success: true,
            mergedSubject,
            deletedParts: partsToDelete
        })

    } catch (error) {
        console.error("Error merging subject:", error)
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการรวมวิชา" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}