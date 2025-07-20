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

        const roomId = roomIdParam ? parseInt(roomIdParam) : undefined;
        const teacherId = teacherIdParam ? parseInt(teacherIdParam) : undefined;

        // ต้องมีอย่างน้อย roomId หรือ teacherId
        if ((!roomId || isNaN(roomId)) && (!teacherId || isNaN(teacherId))) {
            return NextResponse.json([], { status: 200 });
        }

        console.log("API: Fetching timetable for:", { roomId, teacherId, termYear });

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

        if (roomConflicts.length > 0) {
            conflicts.push({
                type: "ROOM_CONFLICT",
                message: `ห้อง ${roomConflicts[0].room?.roomCode} มีการใช้งานในเวลาเดียวกัน`,
                conflicts: roomConflicts
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

        if (teacherConflicts.length > 0) {
            conflicts.push({
                type: "TEACHER_CONFLICT",
                message: `อาจารย์ ${teacherConflicts[0].teacher?.tName} ${teacherConflicts[0].teacher?.tLastName} มีการสอนในเวลาเดียวกัน`,
                conflicts: teacherConflicts
            });
        }

        // ลบส่วนตรวจสอบการสอนต่อเนื่องเกินไป 2.1 ทั้งหมดออก
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