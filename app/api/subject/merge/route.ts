import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import {
    checkCoTeachingGroup,
    handleCoTeachingMerge
} from "@/utils/co-teaching-helper"

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


        const coTeachingGroup = await checkCoTeachingGroup(subjectId);

        if (coTeachingGroup) {

            console.log("พบวิชาสอนร่วม Group Key:", coTeachingGroup.groupKey);


            const relatedCoTeachingGroups = await prisma.coTeaching_tb.findMany({
                where: {
                    OR: [
                        {
                            groupKey: {
                                startsWith: `${subjectCode}-`
                            }
                        },
                        {
                            plans: {
                                some: {
                                    subjectCode: subjectCode,
                                    termYear: subjectToMerge.termYear

                                }
                            }
                        }
                    ]
                },
                include: {
                    plans: {
                        where: {
                            subjectCode: subjectCode,
                            termYear: subjectToMerge.termYear,
                            planType: {
                                in: ["TRANSFER", "FOUR_YEAR"]
                            }

                        }
                    }
                }
            });

            console.log("Related co-teaching groups (all year levels):", relatedCoTeachingGroups.map(g => ({
                id: g.id,
                groupKey: g.groupKey,
                planCount: g.plans.length,
                plans: g.plans.map(p => ({ id: p.id, planType: p.planType, yearLevel: p.yearLevel, subjectName: p.subjectName }))
            })));



            const allPlansToMerge = relatedCoTeachingGroups.flatMap(group => group.plans);

            console.log("All plans to merge (all year levels):", allPlansToMerge.map(p => ({
                id: p.id,
                planType: p.planType,
                yearLevel: p.yearLevel,
                subjectName: p.subjectName
            })));

            if (allPlansToMerge.length === 0) {
                return NextResponse.json({ error: "ไม่พบวิชาที่สามารถรวมได้" }, { status: 400 })
            }


            const groupedByPlanTypeAndYear = allPlansToMerge.reduce((acc, plan) => {
                const key = `${plan.planType}-${plan.yearLevel}`;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(plan);
                return acc;
            }, {} as Record<string, any[]>);

            console.log("Grouped plans:", Object.entries(groupedByPlanTypeAndYear).map(([key, plans]) => ({
                key,
                planCount: plans.length,
                plans: plans.map((p: any) => ({ id: p.id, planType: p.planType, yearLevel: p.yearLevel, subjectName: p.subjectName }))
            })));

            const mergedSubjects = [];
            let allDeletedParts: number[] = [];


            for (const [, plans] of Object.entries(groupedByPlanTypeAndYear)) {
                if (plans.length > 0) {
                    const result = await mergeSubjectPartsWithDeleted(plans, baseSubjectName);
                    mergedSubjects.push(result.mergedSubject);
                    allDeletedParts = allDeletedParts.concat(result.deletedParts);
                }
            }


            await handleCoTeachingMerge(
                subjectCode,
                subjectToMerge.termYear || "",
                mergedSubjects.map(s => s.id)
            );

            return NextResponse.json({
                success: true,
                mergedSubjects,
                mergedSubject: mergedSubjects[0],
                deletedParts: allDeletedParts,
                isCoTeaching: true
            });

        } else {

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

            const result = await mergeSubjectPartsWithDeleted(splitParts, baseSubjectName);

            return NextResponse.json({
                success: true,
                mergedSubject: result.mergedSubject,
                deletedParts: result.deletedParts,
                isCoTeaching: false
            });
        }

    } catch (error) {
        console.error("ผิดพลาดในการรวมวิชา:", error)
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการรวมวิชา" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

async function mergeSubjectParts(splitParts: any[], baseSubjectName: string) {
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

    return mergedSubject;
}

async function mergeSubjectPartsWithDeleted(splitParts: any[], baseSubjectName: string) {
    const mergedSubject = await mergeSubjectParts(splitParts, baseSubjectName);
    const deletedParts = splitParts.slice(1).map(part => part.id);

    return {
        mergedSubject,
        deletedParts
    };
}