
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { planId, termYear, yearLevel, planType, day, startPeriod, endPeriod, roomId, teacherId, section } = body;


        if (!planId || day === undefined || startPeriod === undefined || endPeriod === undefined) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }


        const conflicts = await checkTimeConflicts({
            planId, termYear, yearLevel, planType,
            day, startPeriod, endPeriod, roomId, teacherId, section
        });

        if (conflicts.length > 0) {
            return NextResponse.json({ conflicts }, { status: 409 });
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
                roomId,
                teacherId,
                section
            }
        });

        return NextResponse.json(timetable);
    } catch (error: any) {
        console.error("ผิดพลาดในการบันทึกข้อมูลตารางเรียน:", error);
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
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