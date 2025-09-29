import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import {
    checkCoTeachingGroup,
    handleCoTeachingSplit
} from "@/utils/co-teaching-helper"

const prisma = new PrismaClient()

export async function POST(
    request: Request
) {
    try {

        const { subjectId, splitData } = await request.json()

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

        console.log("ข้อมูลวิชาเดิม:", {
            id: originalSubject.id,
            roomId: originalSubject.roomId,
            teacherId: originalSubject.teacherId,
            section: originalSubject.section,
            room: originalSubject.room,
            teacher: originalSubject.teacher
        })


        const coTeachingGroup = await checkCoTeachingGroup(subjectId);

        let allUpdatedSubjects = [];
        let allNewSubjects = [];

        if (coTeachingGroup) {

            console.log("พบวิชาสอนร่วม Group Key:", coTeachingGroup.groupKey);
            console.log("วิชาในกลุ่ม:", coTeachingGroup.planIds);

            const coTeachingSubjects = await prisma.plans_tb.findMany({
                where: {
                    id: { in: coTeachingGroup.planIds }
                },
                include: {
                    room: true,
                    teacher: true
                }
            });

            const part1Ids: number[] = [];
            const part2Ids: number[] = [];

            for (const subject of coTeachingSubjects) {
                const result = await splitSingleSubject(subject, splitData);
                allUpdatedSubjects.push(result.updatedSubject);
                allNewSubjects.push(result.newSubject);
                part1Ids.push(result.updatedSubject.id);
                part2Ids.push(result.newSubject.id);
            }


            await handleCoTeachingSplit(
                coTeachingGroup.groupKey,
                { part1Ids, part2Ids },
                originalSubject.subjectCode,
                originalSubject.termYear || "",
                {
                    part1: splitData.part1.partNumber,
                    part2: splitData.part2.partNumber
                }
            );

        } else {

            const isDVEPlan = originalSubject.planType === "DVE-MSIX" || originalSubject.planType === "DVE-LVC";

            if (isDVEPlan) {
                const sameSubjects = await prisma.plans_tb.findMany({
                    where: {
                        subjectCode: originalSubject.subjectCode,
                        termYear: originalSubject.termYear,
                        yearLevel: originalSubject.yearLevel,
                        planType: {
                            in: ["DVE-MSIX", "DVE-LVC"]
                        }
                    },
                    include: {
                        room: true,
                        teacher: true
                    }
                });

                console.log("เจอวิชา DVE ที่จะถูกแบ่งแยก:", sameSubjects.length);

                for (const subject of sameSubjects) {
                    const result = await splitSingleSubject(subject, splitData);
                    allUpdatedSubjects.push(result.updatedSubject);
                    allNewSubjects.push(result.newSubject);
                }
            } else {
                const result = await splitSingleSubject(originalSubject, splitData);
                allUpdatedSubjects.push(result.updatedSubject);
                allNewSubjects.push(result.newSubject);
            }
        }

        return NextResponse.json({
            success: true,
            updatedSubject: allUpdatedSubjects[0],
            newSubject: allNewSubjects[0],
            allUpdatedSubjects,
            allNewSubjects,
            isCoTeaching: !!coTeachingGroup
        })

    } catch (error) {
        console.error("ผิดพลาดในการแบ่งวิชา:", error)
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการแบ่งวิชา" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}


async function splitSingleSubject(originalSubject: any, splitData: any) {

    const baseSubjectName = originalSubject.subjectName.replace(/\s*\(ส่วนที่ \d+\)\s*$/, '')
    const originalSection = originalSubject.section || "1";
    const newSection1 = `${originalSection}-1`;
    const newSection2 = `${originalSection}-2`;

    console.log("การคำนวณจำนวนเซกชัน:", {
        originalSection,
        newSection1,
        newSection2
    });

    const { part1, part2 } = splitData


    await prisma.timetable_tb.deleteMany({
        where: { planId: originalSubject.id }
    })


    const updatedSubject = await prisma.plans_tb.update({
        where: { id: originalSubject.id },
        data: {
            subjectName: `${baseSubjectName} (ส่วนที่ ${part1.partNumber})`,
            lectureHour: part1.lectureHour,
            labHour: part1.labHour,

            roomId: originalSubject.roomId,
            teacherId: originalSubject.teacherId,
            section: newSection1
        },
        include: {
            room: true,
            teacher: true
        }
    })


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

    return { updatedSubject, newSubject };
}