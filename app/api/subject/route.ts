import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            subjectCode,
            subjectName,
            credit,
            lectureHour,
            labHour,
            termYear,
            yearLevel,
            planType,
            dep,
            roomId,
            teacherId,
            section
        } = body;

        if (
            !subjectCode ||
            !subjectName ||
            !credit ||
            !lectureHour ||
            !labHour ||
            !termYear ||
            !yearLevel ||
            !planType ||
            !dep
        ) {
            return NextResponse.json(
                { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            );
        }

        const newSubject = await prisma.plans_tb.create({
            data: {
                subjectCode,
                subjectName,
                credit: Number(credit),
                lectureHour: Number(lectureHour),
                labHour: Number(labHour),
                yearLevel,
                planType,
                termYear,
                dep,
                roomId: roomId || null,
                teacherId: teacherId || null,
                section: section || null
            },
            include: {
                room: {
                    select: {
                        id: true,
                        roomCode: true
                    }
                },
                teacher: {
                    select: {
                        id: true,
                        tName: true,
                        tLastName: true,
                        tId: true
                    }
                }
            }
        });

        return NextResponse.json(newSubject, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const yearLevel = url.searchParams.get('yearLevel') || undefined;
    const termYear = url.searchParams.get('termYear') || undefined;
    const planType = url.searchParams.get('planType') || undefined;
    const dep = url.searchParams.get('dep') || undefined; // เพิ่มพารามิเตอร์ dep

    try {
        const where: any = {};

        if (termYear) {
            where.termYear = { contains: termYear };
        }

        if (yearLevel) {
            where.yearLevel = { contains: yearLevel };
        }

        if (planType) {
            where.planType = { contains: planType };
        }

        if (dep) {
            where.dep = { contains: dep };
        }

        console.log('Subject API - สิ่งที่ส่งไป:', { yearLevel, termYear, planType, dep });
        console.log('Subject API - เงื่อนไขการค้นหา:', where);

        const plans = await prisma.plans_tb.findMany({
            where,
            include: {
                room: {
                    select: {
                        id: true,
                        roomCode: true,
                        roomType: true
                    }
                },
                teacher: {
                    select: {
                        id: true,
                        tName: true,
                        tLastName: true,
                        tId: true
                    }
                }
            },
            orderBy: {
                subjectCode: 'asc'
            }
        });

        console.log(`Subject API - พบ ${plans.length} วิชา`);

        return NextResponse.json(plans);
    } catch (error) {
        console.error("ผิดพลาดในการดึงข้อมูลวิชา:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลวิชา" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            id,
            subjectCode,
            subjectName,
            credit,
            lectureHour,
            labHour,
            termYear,
            yearLevel,
            planType,
            dep,
            roomId,
            teacherId,
            section
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: "กรุณาระบุ ID ของวิชาที่ต้องการอัปเดต" },
                { status: 400 }
            );
        }

        const updateData: any = {};

        if (subjectCode !== undefined) updateData.subjectCode = subjectCode;
        if (subjectName !== undefined) updateData.subjectName = subjectName;
        if (credit !== undefined) updateData.credit = Number(credit);
        if (lectureHour !== undefined) updateData.lectureHour = Number(lectureHour);
        if (labHour !== undefined) updateData.labHour = Number(labHour);
        if (termYear !== undefined) updateData.termYear = termYear;
        if (yearLevel !== undefined) updateData.yearLevel = yearLevel;
        if (planType !== undefined) updateData.planType = planType;
        if (dep !== undefined) updateData.dep = dep;
        if (roomId !== undefined) updateData.roomId = roomId;
        if (teacherId !== undefined) updateData.teacherId = teacherId;
        if (section !== undefined) updateData.section = section;

        const updatedSubject = await prisma.plans_tb.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                room: {
                    select: {
                        id: true,
                        roomCode: true
                    }
                },
                teacher: {
                    select: {
                        id: true,
                        tName: true,
                        tLastName: true,
                        tId: true
                    }
                }
            }
        });

        console.log(`Subject API - อัปเดตวิชา ${id}`);

        return NextResponse.json(updatedSubject);
    } catch (error) {
        console.error("ผิดพลาดในการอัปเดตวิชา:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดตวิชา" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}