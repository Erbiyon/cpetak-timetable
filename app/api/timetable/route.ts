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
            isCoTeaching = coTeachingGroup && coTeachingGroup.plans.length > 1;
        }

        // ตรวจสอบการชนกัน (ยกเว้น DVE และ Co-Teaching ของ Transfer/Four Year)
        const shouldCheckConflicts = !isDVE && !(isCoTeaching && isTransferOrFourYear);
        const conflicts = []; // เพิ่มบรรทัดนี้

        if (shouldCheckConflicts) {
            // ตรวจสอบการชนกันปกติ
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

        } else if (isCoTeaching && isTransferOrFourYear) {
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
    }
}


async function checkTimeConflicts({
    planId, termYear, yearLevel, planType,
    day, startPeriod, endPeriod, roomId, teacherId, section
}: {
    planId: number;
    termYear: string;
    yearLevel: string;
    planType: string;
    day: number;
    startPeriod: number;
    endPeriod: number;
    roomId?: number | null;
    teacherId?: number | null;
    section?: string | null;
}) {
    const conflicts = [];


    const currentPlan = await prisma.plans_tb.findUnique({
        where: { id: planId },
        select: { subjectCode: true }
    });

    console.log("ตรวจสอบการชนกันสำหรับการจัดตาราง:");
    console.log("ข้อมูลนำเข้า:", {
        planId,
        termYear,
        yearLevel,
        planType,
        teacherId,
        section,
        subjectCode: currentPlan?.subjectCode,
        teacherIdType: typeof teacherId,
        sectionType: typeof section,
        sectionTrimmed: section?.trim()
    });


    const hasTeacherId = teacherId && teacherId !== null && teacherId !== undefined;
    const hasSection = section !== null && section !== undefined &&
        typeof section === 'string' && section.trim() !== "";

    console.log("ตรวจสอบความถูกต้อง:", { hasTeacherId, hasSection });

    if (hasTeacherId && hasSection) {
        console.log("กำลังตรวจสอบการซ้ำซ้อนของกลุ่มเรียน...");
        const sectionConflicts = await checkSectionDuplicate({
            planId, termYear, yearLevel, planType, teacherId, section: section.trim()
        });
        console.log("พบการซ้ำซ้อนของกลุ่มเรียน:", sectionConflicts.length);
        conflicts.push(...sectionConflicts);
    } else {
        console.log("ข้ามการตรวจสอบการซ้ำซ้อนของกลุ่มเรียน:", {
            teacherId,
            section,
            reason: !hasTeacherId ? "ไม่มี teacherId" : "ไม่มี section"
        });
    }


    if (roomId) {
        const roomConflicts = await prisma.timetable_tb.findMany({
            where: {
                roomId: roomId,
                day: day,
                OR: [
                    {
                        startPeriod: { lte: endPeriod },
                        endPeriod: { gte: startPeriod }
                    }
                ],
                NOT: {
                    planId: planId
                }
            },
            include: {
                plan: true,
                room: true,
                teacher: true
            }
        });


        const filteredRoomConflicts = roomConflicts.filter(item => {
            const isDVEPlan = planType === "DVE-MSIX" || planType === "DVE-LVC";
            const isConflictDVE = item.planType === "DVE-MSIX" || item.planType === "DVE-LVC";


            if (isDVEPlan && isConflictDVE &&
                item.planType !== planType &&
                item.plan?.subjectCode === currentPlan?.subjectCode) {
                console.log(`ยกเว้นการตรวจสอบห้องระหว่าง ${planType} และ ${item.planType} สำหรับวิชา ${currentPlan?.subjectCode}`);
                return false;
            }
            return true;
        });

        if (filteredRoomConflicts.length > 0) {
            conflicts.push({
                type: "ROOM_CONFLICT",
                message: `ห้อง ${filteredRoomConflicts[0].room?.roomCode} มีการใช้งานในเวลาเดียวกัน`,
                conflicts: filteredRoomConflicts
            });
        }
    }


    if (teacherId) {
        const teacherConflicts = await prisma.timetable_tb.findMany({
            where: {
                teacherId: teacherId,
                day: day,
                OR: [
                    {
                        startPeriod: { lte: endPeriod },
                        endPeriod: { gte: startPeriod }
                    }
                ],
                NOT: {
                    planId: planId
                }
            },
            include: {
                plan: true,
                room: true,
                teacher: true
            }
        });


        const filteredTeacherConflicts = teacherConflicts.filter(item => {
            const isDVEPlan = planType === "DVE-MSIX" || planType === "DVE-LVC";
            const isConflictDVE = item.planType === "DVE-MSIX" || item.planType === "DVE-LVC";


            if (isDVEPlan && isConflictDVE &&
                item.planType !== planType &&
                item.plan?.subjectCode === currentPlan?.subjectCode) {
                console.log(`ยกเว้นการตรวจสอบอาจารย์ระหว่าง ${planType} และ ${item.planType} สำหรับวิชา ${currentPlan?.subjectCode}`);
                return false;
            }
            return true;
        });

        if (filteredTeacherConflicts.length > 0) {
            conflicts.push({
                type: "TEACHER_CONFLICT",
                message: `อาจารย์ ${filteredTeacherConflicts[0].teacher?.tName} ${filteredTeacherConflicts[0].teacher?.tLastName} มีการสอนในเวลาเดียวกัน`,
                conflicts: filteredTeacherConflicts
            });
        }
    }


    if (!section) {
        const yearLevelConflicts = await prisma.timetable_tb.findMany({
            where: {
                termYear: termYear,
                yearLevel: yearLevel,
                planType: planType,
                day: day,
                OR: [
                    {
                        startPeriod: { lte: endPeriod },
                        endPeriod: { gte: startPeriod }
                    }
                ],
                section: null,
                NOT: {
                    planId: planId
                }
            },
            include: {
                plan: true
            }
        });

        if (yearLevelConflicts.length > 0) {
            conflicts.push({
                type: "YEAR_LEVEL_CONFLICT",
                message: `นักศึกษา${yearLevel} ${planType === 'TRANSFER' ? 'เทียบโอน' : planType} มีเรียนวิชาอื่นในเวลาเดียวกัน`,
                conflicts: yearLevelConflicts
            });
        }
    }


    if (day === 2) {
        const activityPeriods = [14, 15, 16, 17];
        const hasConflictWithActivity = activityPeriods.some(p =>
            p >= startPeriod && p <= endPeriod
        );

        if (hasConflictWithActivity) {
            conflicts.push({
                type: "ACTIVITY_TIME_CONFLICT",
                message: "เวลาเรียนชนกับช่วงกิจกรรมวันพุธ"
            });
        }
    }

    return conflicts;
}


async function checkSectionDuplicate({
    planId, termYear, yearLevel, planType, teacherId, section
}: {
    planId: number;
    termYear: string;
    yearLevel: string;
    planType: string;
    teacherId: number;
    section: string;
}) {
    try {

        const currentPlan = await prisma.plans_tb.findUnique({
            where: { id: planId },
            include: {
                teacher: true
            }
        });

        if (!currentPlan) {
            return [];
        }


        const sectionPrefix = section.split('-')[0];


        const isSplitSubject = section.includes('-');


        const isDVEPlan = planType === "DVE-MSIX" || planType === "DVE-LVC";


        const duplicateSections = await prisma.timetable_tb.findMany({
            where: {
                AND: [
                    { termYear },
                    { teacherId },
                    { planId: { not: planId } },
                    {
                        plan: {
                            subjectCode: currentPlan.subjectCode
                        }
                    },
                    {
                        OR: [

                            { section },

                            ...(isSplitSubject ? [
                                {
                                    AND: [
                                        { section: { startsWith: `${sectionPrefix}-` } },
                                        { section: { not: section } },

                                        {
                                            plan: {
                                                NOT: {
                                                    AND: [
                                                        { subjectCode: currentPlan.subjectCode },
                                                        { subjectName: { contains: "(ส่วนที่" } }
                                                    ]
                                                }
                                            }
                                        }
                                    ]
                                },
                                {
                                    AND: [
                                        { section: sectionPrefix },

                                        {
                                            plan: {
                                                NOT: {
                                                    AND: [
                                                        { subjectCode: currentPlan.subjectCode },
                                                        { subjectName: { contains: "(ส่วนที่" } }
                                                    ]
                                                }
                                            }
                                        }
                                    ]
                                }
                            ] : [

                                { section: { startsWith: `${sectionPrefix}-` } },
                                { section: sectionPrefix }
                            ])
                        ]
                    }
                ]
            },
            include: {
                plan: true,
                teacher: true,
                room: true
            }
        });


        const filteredDuplicates = duplicateSections.filter(item => {

            if (isDVEPlan && (item.planType === "DVE-MSIX" || item.planType === "DVE-LVC")) {

                if (item.planType !== planType && item.plan?.subjectCode === currentPlan.subjectCode) {
                    console.log(`ยกเว้นการซิ๊งค์ระหว่าง ${planType} และ ${item.planType} สำหรับวิชา ${currentPlan.subjectCode}`);
                    return false;
                }
            }
            return true;
        });

        if (filteredDuplicates.length > 0) {

            const conflictsByPlanAndYear = filteredDuplicates.reduce((acc: any, item) => {
                const key = `${item.planType}-${item.yearLevel}`;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(item);
                return acc;
            }, {});


            const conflictDetails = Object.entries(conflictsByPlanAndYear).map(([key]) => {
                const [planTypeCode, yearLevel] = key.split('-');
                let planTypeText;

                switch (planTypeCode) {
                    case "TRANSFER": planTypeText = "เทียบโอน"; break;
                    case "FOUR_YEAR": planTypeText = "4 ปี"; break;
                    case "DVE-MSIX": planTypeText = "ม.6 ขึ้น ปวส."; break;
                    case "DVE-LVC": planTypeText = "ปวช. ขึ้น ปวส."; break;
                    default: planTypeText = planTypeCode;
                }




                return `${planTypeText} ${yearLevel}`;

            }).join(", ");


            const allConflictingSections = filteredDuplicates.map(item => item.section).join(", ");

            const conflictResult = [{
                type: "SECTION_DUPLICATE_CONFLICT",
                message: `ไม่สามารถจัดตารางได้: อาจารย์ ${currentPlan.teacher?.tName} ${currentPlan.teacher?.tLastName} สอนวิชา ${currentPlan.subjectCode} Section ${section} ซ้ำกับ Section ${allConflictingSections} ที่มีอยู่แล้วในแผน ${conflictDetails} - กรุณาเปลี่ยน Section`,
                conflicts: filteredDuplicates,
                mainSubject: {
                    subjectCode: currentPlan.subjectCode,
                    subjectName: currentPlan.subjectName,
                    yearLevel: yearLevel,
                    planType: planType,
                    section: section,
                    teacher: currentPlan.teacher
                },

                conflictDetails: Object.keys(conflictsByPlanAndYear).map(key => {
                    const [planType, yearLevel] = key.split('-');
                    return { planType, yearLevel };
                })
            }];

            return conflictResult;
        }

        return [];
    } catch (error) {
        console.error("เกิดข้อผิดพลาดระหว่างตรวจสอบการซ้ำของเซกชัน:", error);
        return [];
    }
}