import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!body.tName || !body.tLastName) {
            return NextResponse.json(
                { error: "กรุณากรอกชื่อและนามสกุล" },
                { status: 400 }
            );
        }

        // กำหนดค่า teacherType จาก body หรือใช้ค่าเริ่มต้นถ้าไม่มี
        const teacherType = body.teacherType || "อาจารย์ภายนอกสาขา";

        // สร้าง tId ตามรูปแบบที่กำหนด
        let tId = body.tId;

        // ถ้าไม่มี tId และเป็นอาจารย์ภายในสาขา ให้สร้างรหัส TCPE01-99
        if (!tId && teacherType === "อาจารย์ภายในสาขา") {
            // ดึงอาจารย์ภายในสาขาทั้งหมดที่มีรหัสขึ้นต้นด้วย TCPE
            const existingTeachers = await prisma.teacher_tb.findMany({
                where: {
                    teacherType: "อาจารย์ภายในสาขา",
                    tId: {
                        startsWith: "TCPE"
                    }
                },
                orderBy: {
                    tId: 'asc'
                }
            });

            // หาเลขสูงสุดที่มีอยู่
            let maxNumber = 0;

            for (const teacher of existingTeachers) {
                // ดึงเฉพาะตัวเลขจากรหัส TCPE
                const match = teacher.tId.match(/^TCPE(\d{2})$/);
                if (match && match[1]) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }

            // เพิ่มเลขถัดไป (หรือเริ่มที่ 01 ถ้ายังไม่มี)
            const nextNumber = maxNumber + 1;

            // ตรวจสอบว่าเลขอยู่ในช่วง 1-99
            if (nextNumber > 99) {
                return NextResponse.json(
                    { error: "รหัสอาจารย์ภายในสาขาเต็มแล้ว (สูงสุดคือ TCPE99)" },
                    { status: 400 }
                );
            }

            // สร้างรหัส TCPE + เลข 2 หลัก (01-99)
            tId = `TCPE${nextNumber.toString().padStart(2, '0')}`;
        }
        // ถ้าไม่มี tId และเป็นอาจารย์ภายนอกสาขา ให้สร้างรหัส TOUT01-999
        else if (!tId && teacherType === "อาจารย์ภายนอกสาขา") {
            // ดึงอาจารย์ภายนอกสาขาทั้งหมดที่มีรหัสขึ้นต้นด้วย TOUT
            const existingTeachers = await prisma.teacher_tb.findMany({
                where: {
                    teacherType: "อาจารย์ภายนอกสาขา",
                    tId: {
                        startsWith: "TOUT"
                    }
                },
                orderBy: {
                    tId: 'asc'
                }
            });

            // หาเลขสูงสุดที่มีอยู่
            let maxNumber = 0;

            for (const teacher of existingTeachers) {
                // ดึงเฉพาะตัวเลขจากรหัส TOUT
                const match = teacher.tId.match(/^TOUT(\d{1,3})$/);
                if (match && match[1]) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }

            // เพิ่มเลขถัดไป (หรือเริ่มที่ 01 ถ้ายังไม่มี)
            const nextNumber = maxNumber + 1;

            // ตรวจสอบว่าเลขอยู่ในช่วง 1-999
            if (nextNumber > 999) {
                return NextResponse.json(
                    { error: "รหัสอาจารย์ภายนอกสาขาเต็มแล้ว (สูงสุดคือ TOUT999)" },
                    { status: 400 }
                );
            }

            // สร้างรหัส TOUT + เลข 1-3 หลัก (01-999) โดยเติม 0 ข้างหน้าให้ครบ
            // เช่น 1 -> 001, 25 -> 025, 999 -> 999
            tId = `TOUT${nextNumber.toString().padStart(3, '0')}`;
        }
        // กรณีอื่นๆ ที่ไม่มี tId และไม่เข้าเงื่อนไขด้านบน
        else if (!tId) {
            tId = `T${Date.now()}`;
        }

        // ตรวจสอบว่า tId ซ้ำหรือไม่
        const existingTeacher = await prisma.teacher_tb.findFirst({
            where: { tId: tId }
        });

        // ถ้าซ้ำ ให้แจ้งเตือน (ไม่ว่าจะเป็นอาจารย์ประเภทใด)
        if (existingTeacher) {
            return NextResponse.json(
                { error: `รหัสอาจารย์ ${tId} มีอยู่ในระบบแล้ว` },
                { status: 400 }
            );
        }

        // สร้างข้อมูลอาจารย์
        const newTeacher = await prisma.teacher_tb.create({
            data: {
                tId: tId,
                tName: body.tName,
                tLastName: body.tLastName,
                teacherType: teacherType
            }
        });

        return NextResponse.json(newTeacher, { status: 201 });
    } catch (error: any) {
        console.error("Error creating teacher:", error);
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาดในการสร้างข้อมูลอาจารย์" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const inDepartment = url.searchParams.get('inDepartment') === "true";

        let teachers;

        if (inDepartment) {
            // ดึงเฉพาะอาจารย์ในสาขาโดยใช้ teacherType
            teachers = await prisma.teacher_tb.findMany({
                where: {
                    teacherType: "อาจารย์ภายในสาขา"
                },
                orderBy: {
                    tName: 'asc',
                }
            });
        } else {
            // ดึงอาจารย์ทั้งหมด
            teachers = await prisma.teacher_tb.findMany({
                orderBy: {
                    tName: 'asc',
                }
            });
        }

        return NextResponse.json(teachers);
    } catch (error: any) {
        console.error("Error fetching teachers:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch teachers" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// เพิ่ม method อื่นๆ ตามที่มีอยู่เดิม (POST, PUT, DELETE)