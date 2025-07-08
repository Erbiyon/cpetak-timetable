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

        // อัปเดตข้อมูล roomId ของวิชา
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
                room: true // รวมข้อมูลห้องเรียนด้วย
            },
            orderBy: {
                id: "asc"
            }
        });

        return NextResponse.json(subjects);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch subjects" },
            { status: 500 }
        );
    }
}