import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(
    request: Request,
) {
    try {



        const { subjectId } = await request.json()


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


        const baseSubjectName = subjectToMerge.subjectName.replace(/\s*\(ส่วนที่ \d+\)\s*$/, '')
        const subjectCode = subjectToMerge.subjectCode


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


        const splitParts = allParts.filter(part =>
            part.subjectName.includes('(ส่วนที่')
        )

        if (splitParts.length < 2) {
            return NextResponse.json({ error: "ไม่พบส่วนที่แบ่งเพื่อรวม" }, { status: 400 })
        }

        console.log("ข้อมูลส่วนที่พบทั้งหมด:", splitParts.map(p => ({
            id: p.id,
            name: p.subjectName,
            roomId: p.roomId,
            teacherId: p.teacherId,
            section: p.section,
            lectureHour: p.lectureHour,
            labHour: p.labHour
        })));


        const totalLectureHours = splitParts.reduce((sum, part) => sum + (part.lectureHour || 0), 0)
        const totalLabHours = splitParts.reduce((sum, part) => sum + (part.labHour || 0), 0)



        let originalSection = null;
        for (const part of splitParts) {
            if (part.section) {

                const sectionMatch = part.section.match(/^(.+)-\d+$/);
                if (sectionMatch) {
                    originalSection = sectionMatch[1];
                    break;
                } else {

                    originalSection = part.section;
                    break;
                }
            }
        }

        console.log("การคำนวณ section เดิม:", {
            splitParts: splitParts.map(p => ({ id: p.id, section: p.section })),
            originalSection
        });


        let mergedRoomId = null;
        let mergedTeacherId = null;

        for (const part of splitParts) {
            if (!mergedRoomId && part.roomId) mergedRoomId = part.roomId;
            if (!mergedTeacherId && part.teacherId) mergedTeacherId = part.teacherId;
        }

        console.log("ข้อมูลที่จะรวม:", {
            roomId: mergedRoomId,
            teacherId: mergedTeacherId,
            section: originalSection,
            lectureHour: totalLectureHours,
            labHour: totalLabHours
        });


        await prisma.timetable_tb.deleteMany({
            where: {
                planId: {
                    in: splitParts.map(part => part.id)
                }
            }
        })


        const mergedSubject = await prisma.plans_tb.update({
            where: { id: splitParts[0].id },
            data: {
                subjectName: baseSubjectName,
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

        console.log("รวมสำเร็จ:", {
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
        console.error("ผิดพลาดในการรวมวิชา:", error)
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการรวมวิชา" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}