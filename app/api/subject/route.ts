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
            dep
        } = body;

        if (
            !subjectCode ||
            !subjectName ||
            !credit ||
            !lectureHour ||
            !labHour ||
            !termYear ||
            !yearLevel ||
            !planType
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
                dep
            },
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
        // สร้างเงื่อนไขการค้นหา
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
            where.dep = { contains: dep }; // เพิ่มการกรองตาม dep
        }

        console.log('Subject API - Query params:', { yearLevel, termYear, planType, dep });
        console.log('Subject API - Where clause:', where);

        // ดึงข้อมูลจาก database ด้วย Prisma
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

        console.log(`Subject API - Found ${plans.length} subjects`);

        // ส่งข้อมูลกลับไป
        return NextResponse.json(plans);
    } catch (error) {
        console.error("Error fetching plans:", error);
        return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}