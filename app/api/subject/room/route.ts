import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
    try {
        const { subjectId, roomId } = await request.json();

        if (!subjectId) {
            return NextResponse.json(
                { error: "กรุณาระบุรหัสวิชา" },
                { status: 400 }
            );
        }


        const updatedSubject = await prisma.plans_tb.update({
            where: { id: Number(subjectId) },
            data: {
                roomId: roomId ? Number(roomId) : null
            },
            include: {
                room: true
            }
        });

        return NextResponse.json(updatedSubject, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const subjects = await prisma.plans_tb.findMany({
            include: {
                room: true
            },
            orderBy: {
                id: "asc"
            }
        });

        return NextResponse.json(subjects);
    } catch (error) {
        return NextResponse.json(
            { error: "ดึงข้อมูลวิชาไม่สำเร็จ" },
            { status: 500 }
        );
    }
}