import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { planId, termYear, yearLevel, planType, day, startPeriod, endPeriod, roomId, teacherId, section } = body;

        // ตรวจสอบประเภทของแผนการเรียน
        const isDVE = planType === 'DVE-MSIX' || planType === 'DVE-LVC';
        const isTransferOrFourYear = planType === 'TRANSFER' || planType === 'FOUR_YEAR';

        // ตรวจสอบ Co-Teaching (เฉพาะ Transfer และ Four Year)
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
            // แก้ไขการกำหนดค่า isCoTeaching
            isCoTeaching = coTeachingGroup !== null && coTeachingGroup.plans.length > 1;
        }

        // ตรวจสอบการชนกัน (ยกเว้น DVE และ Co-Teaching ของ Transfer/Four Year)
        const shouldCheckConflicts = !isDVE && !(isCoTeaching && isTransferOrFourYear);
        const conflicts: any[] = []; // เพิ่ม type annotation

        if (shouldCheckConflicts) {
            // ตรวจสอบการชนกันของเวลา
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

            // ตรวจสอบการชนกันของอาจารย์
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

            // ตรวจสอบการชนกันของห้องเรียน
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
        }

        // หากมีการชนกันและไม่ใช่ DVE หรือ Co-Teaching ของ Transfer/Four Year
        if (conflicts.length > 0) {
            return Response.json({ conflicts }, { status: 409 });
        }

        // ลบข้อมูลเก่าก่อน
        await prisma.timetable_tb.deleteMany({
            where: { planId }
        });

        // สร้างข้อมูลใหม่
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
            // DVE: สร้างตารางเรียนเดียวกันสำหรับวิชาที่มีรหัสเหมือนกัน
            const currentPlan = await prisma.plans_tb.findUnique({
                where: { id: planId }
            });

            if (currentPlan) {
                const duplicatePlans = await prisma.plans_tb.findMany({
                    where: {
                        subjectCode: currentPlan.subjectCode,
                        termYear: currentPlan.termYear,
                        NOT: {
                            id: planId
                        }
                    }
                });

                for (const duplicatePlan of duplicatePlans) {
                    // ลบข้อมูลเก่า
                    await prisma.timetable_tb.deleteMany({
                        where: { planId: duplicatePlan.id }
                    });

                    // สร้างข้อมูลใหม่ในเวลาเดียวกัน
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

        } else if (isCoTeaching && isTransferOrFourYear && coTeachingGroup) {
            // Transfer/Four Year Co-Teaching: สร้างตารางเรียนเดียวกันสำหรับวิชาอื่นๆ ในกลุ่ม
            const otherPlans = coTeachingGroup.plans.filter(p => p.id !== planId);

            for (const otherPlan of otherPlans) {
                // ลบข้อมูลเก่า
                await prisma.timetable_tb.deleteMany({
                    where: { planId: otherPlan.id }
                });

                // สร้างข้อมูลใหม่ในเวลาเดียวกัน
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