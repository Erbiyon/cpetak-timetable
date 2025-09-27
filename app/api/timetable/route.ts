import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { planId, termYear, yearLevel, planType, day, startPeriod, endPeriod, roomId, teacherId, section } = body;

        const isDVE = planType === 'DVE-MSIX' || planType === 'DVE-LVC';
        const isTransferOrFourYear = planType === 'TRANSFER' || planType === 'FOUR_YEAR';

        let coTeachingGroup = null;
        let isCoTeaching = false;

        if (isTransferOrFourYear) {
            coTeachingGroup = await prisma.coTeaching_tb.findFirst({
                where: {
                    plans: {
                        some: {
                            id: planId
                        }
                    }
                },
                include: {
                    plans: {
                        include: {
                            teacher: true,
                            room: true
                        }
                    }
                }
            });

            isCoTeaching = coTeachingGroup !== null && coTeachingGroup.plans.length > 1;
        }

        const shouldCheckConflicts = !(isCoTeaching && isTransferOrFourYear);
        const conflicts: any[] = [];

        if (shouldCheckConflicts) {

            const timeConflicts = await prisma.timetable_tb.findMany({
                where: {
                    termYear,
                    yearLevel,
                    planType,
                    day,
                    OR: [
                        {
                            AND: [
                                { startPeriod: { lte: startPeriod } },
                                { endPeriod: { gte: startPeriod } }
                            ]
                        },
                        {
                            AND: [
                                { startPeriod: { lte: endPeriod } },
                                { endPeriod: { gte: endPeriod } }
                            ]
                        },
                        {
                            AND: [
                                { startPeriod: { gte: startPeriod } },
                                { endPeriod: { lte: endPeriod } }
                            ]
                        }
                    ],
                    NOT: {
                        planId: planId
                    }
                },
                include: {
                    plan: true,
                    teacher: true,
                    room: true
                }
            });

            if (timeConflicts.length > 0) {
                conflicts.push({
                    type: "TIME_CONFLICT",
                    message: "พบการชนกันของเวลาเรียน",
                    conflicts: timeConflicts.map(tc => ({
                        planId: tc.planId,
                        plan: tc.plan,
                        day: tc.day,
                        startPeriod: tc.startPeriod,
                        endPeriod: tc.endPeriod,
                        teacher: tc.teacher,
                        room: tc.room,
                        section: tc.section
                    }))
                });
            }

            if (teacherId) {
                const teacherConflicts = await prisma.timetable_tb.findMany({
                    where: {
                        teacherId,
                        termYear,
                        day,
                        OR: [
                            {
                                AND: [
                                    { startPeriod: { lte: startPeriod } },
                                    { endPeriod: { gte: startPeriod } }
                                ]
                            },
                            {
                                AND: [
                                    { startPeriod: { lte: endPeriod } },
                                    { endPeriod: { gte: endPeriod } }
                                ]
                            },
                            {
                                AND: [
                                    { startPeriod: { gte: startPeriod } },
                                    { endPeriod: { lte: endPeriod } }
                                ]
                            }
                        ],
                        NOT: {
                            planId: planId
                        }
                    },
                    include: {
                        plan: true,
                        teacher: true,
                        room: true
                    }
                });

                if (teacherConflicts.length > 0) {
                    conflicts.push({
                        type: "TEACHER_CONFLICT",
                        message: "อาจารย์มีการสอนในเวลาดังกล่าวแล้ว",
                        conflicts: teacherConflicts.map(tc => ({
                            planId: tc.planId,
                            plan: tc.plan,
                            day: tc.day,
                            startPeriod: tc.startPeriod,
                            endPeriod: tc.endPeriod,
                            teacher: tc.teacher,
                            room: tc.room,
                            section: tc.section
                        }))
                    });
                }
            }

            if (roomId) {
                const roomConflicts = await prisma.timetable_tb.findMany({
                    where: {
                        roomId,
                        termYear,
                        day,
                        OR: [
                            {
                                AND: [
                                    { startPeriod: { lte: startPeriod } },
                                    { endPeriod: { gte: startPeriod } }
                                ]
                            },
                            {
                                AND: [
                                    { startPeriod: { lte: endPeriod } },
                                    { endPeriod: { gte: endPeriod } }
                                ]
                            },
                            {
                                AND: [
                                    { startPeriod: { gte: startPeriod } },
                                    { endPeriod: { lte: endPeriod } }
                                ]
                            }
                        ],
                        NOT: {
                            planId: planId
                        }
                    },
                    include: {
                        plan: true,
                        teacher: true,
                        room: true
                    }
                });

                if (roomConflicts.length > 0) {
                    conflicts.push({
                        type: "ROOM_CONFLICT",
                        message: "ห้องเรียนถูกใช้งานในเวลาดังกล่าวแล้ว",
                        conflicts: roomConflicts.map(tc => ({
                            planId: tc.planId,
                            plan: tc.plan,
                            day: tc.day,
                            startPeriod: tc.startPeriod,
                            endPeriod: tc.endPeriod,
                            teacher: tc.teacher,
                            room: tc.room,
                            section: tc.section
                        }))
                    });
                }
            }



            if (section) {
                const currentPlan = await prisma.plans_tb.findUnique({
                    where: { id: planId }
                });

                if (currentPlan) {
                    const currentIsDVE = currentPlan.planType === 'DVE-MSIX' || currentPlan.planType === 'DVE-LVC';

                    const duplicateSectionPlans = await prisma.plans_tb.findMany({
                        where: {
                            subjectCode: currentPlan.subjectCode,
                            termYear: currentPlan.termYear,
                            section: section,
                            planType: {
                                not: currentPlan.planType
                            },
                            NOT: {
                                id: planId
                            }
                        },
                        include: {
                            timetables: true
                        }
                    });

                    const filteredDuplicates = currentIsDVE
                        ? duplicateSectionPlans.filter(plan =>
                            plan.planType !== 'DVE-MSIX' && plan.planType !== 'DVE-LVC'
                        )
                        : duplicateSectionPlans;

                    if (filteredDuplicates.length > 0) {
                        const conflictDetails = filteredDuplicates.map(plan => {
                            const planTypeText = plan.planType === 'TRANSFER' ? 'เทียบโอน' :
                                plan.planType === 'FOUR_YEAR' ? '4 ปี' :
                                    plan.planType === 'DVE-MSIX' ? 'DVE-MSIX' :
                                        plan.planType === 'DVE-LVC' ? 'DVE-LVC' :
                                            plan.planType;
                            return `${planTypeText} ${plan.yearLevel}`;
                        }).join(', ');

                        conflicts.push({
                            type: "DUPLICATE_SECTION_CONFLICT",
                            message: `วิชา ${currentPlan.subjectCode} section ${section} มีอยู่แล้วในแผนการเรียน: ${conflictDetails}`,
                            conflicts: filteredDuplicates.map(plan => ({
                                planId: plan.id,
                                subjectCode: plan.subjectCode,
                                planType: plan.planType,
                                yearLevel: plan.yearLevel,
                                section: plan.section,
                                termYear: plan.termYear
                            }))
                        });
                    }
                }
            }
        }

        if (conflicts.length > 0) {
            return Response.json({ conflicts }, { status: 409 });
        }

        await prisma.timetable_tb.deleteMany({
            where: { planId }
        });


        const timetable = await prisma.timetable_tb.create({
            data: {
                planId,
                termYear,
                yearLevel,
                planType,
                day,
                startPeriod,
                endPeriod,
                roomId: roomId || null,
                teacherId: teacherId || null,
                section: section || null
            },
            include: {
                plan: {
                    include: {
                        teacher: true,
                        room: true
                    }
                },
                teacher: true,
                room: true
            }
        });

        if (isDVE) {

            const currentPlan = await prisma.plans_tb.findUnique({
                where: { id: planId }
            });

            if (currentPlan) {
                const isSplitSubject = currentPlan.subjectName && currentPlan.subjectName.includes('(ส่วนที่');

                if (isSplitSubject) {
                    console.log(`� [API-SYNC] ซิ๊งค์วิชาที่แบ่งแล้ว: ${currentPlan.subjectName} (planId: ${planId})`);

                    const duplicatePlans = await prisma.plans_tb.findMany({
                        where: {
                            subjectCode: currentPlan.subjectCode,
                            subjectName: currentPlan.subjectName,
                            termYear: currentPlan.termYear,
                            yearLevel: currentPlan.yearLevel,
                            NOT: {
                                id: planId
                            }
                        }
                    });

                    console.log(`🎯 [API-SYNC] พบวิชาส่วนเดียวกัน ${duplicatePlans.length} รายการ`);

                    for (const duplicatePlan of duplicatePlans) {
                        console.log(`  📋 ซิ๊งค์ไปยัง: ${duplicatePlan.subjectName} (${duplicatePlan.planType}) planId: ${duplicatePlan.id}`);

                        await prisma.timetable_tb.deleteMany({
                            where: { planId: duplicatePlan.id }
                        });

                        await prisma.timetable_tb.create({
                            data: {
                                planId: duplicatePlan.id,
                                termYear,
                                yearLevel: duplicatePlan.yearLevel || yearLevel,
                                planType: duplicatePlan.planType || planType,
                                day,
                                startPeriod,
                                endPeriod,
                                roomId: duplicatePlan.roomId || null,
                                teacherId: duplicatePlan.teacherId || null,
                                section: duplicatePlan.section || null
                            }
                        });
                    }
                } else {
                    console.log(`🔄 [API-SYNC] ทำการซิ๊งค์วิชาปกติ: ${currentPlan.subjectName} (planId: ${planId})`);

                    const duplicatePlans = await prisma.plans_tb.findMany({
                        where: {
                            subjectCode: currentPlan.subjectCode,
                            termYear: currentPlan.termYear,
                            yearLevel: currentPlan.yearLevel,
                            NOT: {
                                id: planId
                            }
                        }
                    });

                    for (const duplicatePlan of duplicatePlans) {

                        await prisma.timetable_tb.deleteMany({
                            where: { planId: duplicatePlan.id }
                        });

                        await prisma.timetable_tb.create({
                            data: {
                                planId: duplicatePlan.id,
                                termYear,
                                yearLevel: duplicatePlan.yearLevel || yearLevel,
                                planType: duplicatePlan.planType || planType,
                                day,
                                startPeriod,
                                endPeriod,
                                roomId: duplicatePlan.roomId || null,
                                teacherId: duplicatePlan.teacherId || null,
                                section: duplicatePlan.section || null
                            }
                        });
                    }
                }
            }

        } else if (isCoTeaching && isTransferOrFourYear && coTeachingGroup) {

            const otherPlans = coTeachingGroup.plans.filter(p => p.id !== planId);

            for (const otherPlan of otherPlans) {

                await prisma.timetable_tb.deleteMany({
                    where: { planId: otherPlan.id }
                });


                await prisma.timetable_tb.create({
                    data: {
                        planId: otherPlan.id,
                        termYear,
                        yearLevel: otherPlan.yearLevel || yearLevel,
                        planType: otherPlan.planType || planType,
                        day,
                        startPeriod,
                        endPeriod,
                        roomId: otherPlan.roomId || null,
                        teacherId: otherPlan.teacherId || null,
                        section: otherPlan.section || null
                    }
                });
            }
        }

        return Response.json(timetable);

    } catch (error) {
        console.error("Error creating timetable:", error);
        return Response.json(
            { error: "เกิดข้อผิดพลาดในการสร้างตารางเรียน" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const roomIdParam = url.searchParams.get("roomId");
        const teacherIdParam = url.searchParams.get("teacherId");
        const termYear = url.searchParams.get("termYear");
        const yearLevel = url.searchParams.get("yearLevel");
        const planType = url.searchParams.get("planType");

        const roomId = roomIdParam ? parseInt(roomIdParam) : undefined;
        const teacherId = teacherIdParam ? parseInt(teacherIdParam) : undefined;

        console.log("API: กำลังดึงข้อมูลตารางเรียนสำหรับ:", { roomId, teacherId, termYear, yearLevel, planType });


        const whereCondition: any = {};


        if (roomId && !isNaN(roomId)) {
            whereCondition.roomId = roomId;
        }


        if (teacherId && !isNaN(teacherId)) {
            whereCondition.teacherId = teacherId;
        }


        if (termYear) {
            whereCondition.termYear = termYear;
        }


        if (yearLevel) {
            whereCondition.yearLevel = yearLevel;
        }


        if (planType) {
            whereCondition.planType = planType;
        }


        if (Object.keys(whereCondition).length === 0) {
            return NextResponse.json([]);
        }

        const timetables = await prisma.timetable_tb.findMany({
            where: whereCondition,
            include: {
                plan: true,
                room: true,
                teacher: true,
            },
            orderBy: [
                { day: 'asc' },
                { startPeriod: 'asc' }
            ]
        });

        console.log(`API: พบ ${timetables.length} รายการสำหรับเงื่อนไขที่ระบุ`);

        return NextResponse.json(timetables);
    } catch (error: any) {
        console.error("ผิดพลาดในการดึงข้อมูลตารางเรียน:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}