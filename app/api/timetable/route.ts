// app/api/timetable/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// API บันทึกการจัดตาราง
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { planId, termYear, yearLevel, planType, day, startPeriod, endPeriod, roomId, teacherId, section } = body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!planId || day === undefined || startPeriod === undefined || endPeriod === undefined) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        // ตรวจสอบการชนกันก่อนบันทึก
        const conflicts = await checkTimeConflicts({
            planId, termYear, yearLevel, planType,
            day, startPeriod, endPeriod, roomId, teacherId, section
        });

        if (conflicts.length > 0) {
            return NextResponse.json({ conflicts }, { status: 409 });
        }

        // ลบข้อมูลเดิมของวิชานี้ (ถ้ามี) ก่อนบันทึกข้อมูลใหม่
        await prisma.timetable_tb.deleteMany({
            where: { planId }
        });

        // บันทึกข้อมูลตารางเรียน
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
        console.error("Error saving timetable:", error);
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// API ดึงข้อมูลตารางทั้งหมด
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

        console.log("API: Fetching timetable for:", { roomId, teacherId, termYear, yearLevel, planType });

        // สร้าง where condition
        const whereCondition: any = {};

        // เพิ่มเงื่อนไข roomId ถ้ามี
        if (roomId && !isNaN(roomId)) {
            whereCondition.roomId = roomId;
        }

        // เพิ่มเงื่อนไข teacherId ถ้ามี
        if (teacherId && !isNaN(teacherId)) {
            whereCondition.teacherId = teacherId;
        }

        // เพิ่มเงื่อนไขภาคเรียนถ้ามีการส่งมา
        if (termYear) {
            whereCondition.termYear = termYear;
        }

        // เพิ่มเงื่อนไข yearLevel ถ้ามี
        if (yearLevel) {
            whereCondition.yearLevel = yearLevel;
        }

        // เพิ่มเงื่อนไข planType ถ้ามี
        if (planType) {
            whereCondition.planType = planType;
        }

        // ถ้าไม่มีเงื่อนไขใดๆ ให้ส่งค่าว่างกลับ
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

        console.log(`API: Found ${timetables.length} entries for the specified criteria`);

        return NextResponse.json(timetables);
    } catch (error: any) {
        console.error("Error fetching timetable:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ฟังก์ชันตรวจสอบการชนกัน
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

    // ดึงข้อมูลวิชาปัจจุบันเพื่อใช้ในการตรวจสอบ
    const currentPlan = await prisma.plans_tb.findUnique({
        where: { id: planId },
        select: { subjectCode: true }
    });

    console.log("=== Checking Time Conflicts ===");
    console.log("Input data:", {
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

    // ตรวจสอบเงื่อนไขให้ชัดเจน
    const hasTeacherId = teacherId && teacherId !== null && teacherId !== undefined;
    const hasSection = section !== null && section !== undefined &&
        typeof section === 'string' && section.trim() !== "";

    console.log("Validation checks:", { hasTeacherId, hasSection });

    if (hasTeacherId && hasSection) {
        console.log("Checking section duplicate...");
        const sectionConflicts = await checkSectionDuplicate({
            planId, termYear, yearLevel, planType, teacherId, section: section.trim()
        });
        console.log("Section conflicts found:", sectionConflicts.length);
        conflicts.push(...sectionConflicts);
    } else {
        console.log("Skipping section duplicate check:", {
            teacherId,
            section,
            reason: !hasTeacherId ? "No teacherId" : "No section"
        });
    }

    // 1. ตรวจสอบการชนกันของห้องเรียน
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
                    planId: planId // ไม่นับวิชาเดียวกัน
                }
            },
            include: {
                plan: true,
                room: true,
                teacher: true
            }
        });

        // กรองออกการซิ๊งค์ระหว่าง DVE planTypes ที่มีรหัสวิชาเดียวกัน
        const filteredRoomConflicts = roomConflicts.filter(item => {
            const isDVEPlan = planType === "DVE-MSIX" || planType === "DVE-LVC";
            const isConflictDVE = item.planType === "DVE-MSIX" || item.planType === "DVE-LVC";

            // ถ้าทั้งคู่เป็น DVE planType และมีรหัสวิชาเดียวกัน ให้ยกเว้น
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

    // 2. ตรวจสอบการชนกันของอาจารย์
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
                    planId: planId // ไม่นับวิชาเดียวกัน
                }
            },
            include: {
                plan: true,
                room: true,
                teacher: true
            }
        });

        // กรองออกการซิ๊งค์ระหว่าง DVE planTypes ที่มีรหัสวิชาเดียวกัน
        const filteredTeacherConflicts = teacherConflicts.filter(item => {
            const isDVEPlan = planType === "DVE-MSIX" || planType === "DVE-LVC";
            const isConflictDVE = item.planType === "DVE-MSIX" || item.planType === "DVE-LVC";

            // ถ้าทั้งคู่เป็น DVE planType และมีรหัสวิชาเดียวกัน ให้ยกเว้น
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

    // 3. ตรวจสอบการชนกันของนักศึกษาชั้นปีเดียวกัน (ยกเว้นกรณีมี section แยก)
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
                section: null, // เฉพาะวิชาที่ไม่ได้แบ่ง section
                NOT: {
                    planId: planId // ไม่นับวิชาเดียวกัน
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

    // 4. ตรวจสอบการชนกับช่วงกิจกรรม (วันพุธ คาบ 14-17)
    if (day === 2) { // วันพุธ
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

// แก้ไขฟังก์ชันตรวจสอบ Section Duplicate
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
        // ดึงข้อมูลวิชาที่กำลังจะจัดตาราง
        const currentPlan = await prisma.plans_tb.findUnique({
            where: { id: planId },
            include: {
                teacher: true
            }
        });

        if (!currentPlan) {
            return [];
        }

        // แยกเลขตัวแรกของ section (prefix) สำหรับตรวจสอบการชนกัน
        const sectionPrefix = section.split('-')[0];

        // ตรวจสอบว่าเป็นวิชาที่มีการแบ่งส่วน (มี "-" ใน section)
        const isSplitSubject = section.includes('-');

        // ตรวจสอบว่าเป็น DVE planType หรือไม่
        const isDVEPlan = planType === "DVE-MSIX" || planType === "DVE-LVC";

        // ค้นหาวิชาที่มีเงื่อนไขเดียวกันในทุกแผนการเรียนและทุกชั้นปี
        const duplicateSections = await prisma.timetable_tb.findMany({
            where: {
                AND: [
                    { termYear }, // ภาคเรียนเดียวกัน
                    { teacherId }, // อาจารย์คนเดียวกัน
                    { planId: { not: planId } }, // ไม่รวมวิชาตัวเอง
                    {
                        plan: {
                            subjectCode: currentPlan.subjectCode // รหัสวิชาเดียวกัน
                        }
                    },
                    {
                        OR: [
                            // กรณีที่ section ตรงกันทุกตัว
                            { section },
                            // กรณีที่เป็นวิชาแบ่งส่วน: ตรวจสอบเฉพาะวิชาที่ไม่ใช่ส่วนเดียวกัน
                            ...(isSplitSubject ? [
                                {
                                    AND: [
                                        { section: { startsWith: `${sectionPrefix}-` } },
                                        { section: { not: section } }, // ไม่ใช่ section เดียวกัน
                                        // ตรวจสอบเพิ่มเติมว่าไม่ใช่วิชาที่ถูกแบ่งออกมาจากวิชาเดียวกัน
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
                                        // ตรวจสอบเพิ่มเติมว่าไม่ใช่วิชาที่ถูกแบ่งออกมาจากวิชาเดียวกัน
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
                                // กรณีที่ไม่ใช่วิชาแบ่งส่วน: ตรวจสอบปกติ
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

        // กรองออกการซิ๊งค์ระหว่าง DVE planTypes ที่มีรหัสวิชาเดียวกัน
        const filteredDuplicates = duplicateSections.filter(item => {
            // ถ้าเป็น DVE planType และมีรหัสวิชาเดียวกัน ให้ยกเว้น
            if (isDVEPlan && (item.planType === "DVE-MSIX" || item.planType === "DVE-LVC")) {
                // ยกเว้นถ้าเป็น planType ต่างกันแต่รหัสวิชาเดียวกัน
                if (item.planType !== planType && item.plan?.subjectCode === currentPlan.subjectCode) {
                    console.log(`ยกเว้นการซิ๊งค์ระหว่าง ${planType} และ ${item.planType} สำหรับวิชา ${currentPlan.subjectCode}`);
                    return false;
                }
            }
            return true;
        });

        if (filteredDuplicates.length > 0) {
            // จัดกลุ่ม conflicts ตาม planType และ yearLevel และแสดงรายละเอียด section ที่ซ้ำ
            const conflictsByPlanAndYear = filteredDuplicates.reduce((acc: any, item) => {
                const key = `${item.planType}-${item.yearLevel}`;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(item);
                return acc;
            }, {});

            // สร้าง message ที่แสดงแผนและชั้นปีที่มีการซ้ำกัน พร้อมรายละเอียด section
            const conflictDetails = Object.entries(conflictsByPlanAndYear).map(([key, items]) => {
                const [planTypeCode, yearLevel] = key.split('-');
                let planTypeText;

                switch (planTypeCode) {
                    case "TRANSFER": planTypeText = "เทียบโอน"; break;
                    case "FOUR_YEAR": planTypeText = "4 ปี"; break;
                    case "DVE-MSIX": planTypeText = "ม.6 ขึ้น ปวส."; break;
                    case "DVE-LVC": planTypeText = "ปวช. ขึ้น ปวส."; break;
                    default: planTypeText = planTypeCode;
                }

                // รวบรวม section ที่ซ้ำกันในแต่ละแผน
                // const conflictingSections = (items as any[]).map((item: any) => `Section ${item.section}`).join(", ");

                return `${planTypeText} ${yearLevel}`;
                // (ซ้ำกับ ${conflictingSections})
            }).join(", ");

            // สร้างรายการ section ทั้งหมดที่ซ้ำกัน
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
                // เก็บข้อมูลความขัดแย้งในรูปแบบที่เข้าถึงง่าย
                conflictDetails: Object.keys(conflictsByPlanAndYear).map(key => {
                    const [planType, yearLevel] = key.split('-');
                    return { planType, yearLevel };
                })
            }];

            return conflictResult;
        }

        return [];
    } catch (error) {
        console.error("Error checking section duplicate:", error);
        return [];
    }
}