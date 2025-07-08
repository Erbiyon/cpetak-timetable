import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
    try {
        const { subjectId, teacherId } = await request.json();

        if (!subjectId) {
            return NextResponse.json(
                { error: "กรุณาระบุรหัสวิชา" },
                { status: 400 }
            );
        }

        // อัปเดตข้อมูล teacherId ของวิชา
        const updatedSubject = await prisma.plans_tb.update({
            where: { id: Number(subjectId) },
            data: {
                teacherId: teacherId ? Number(teacherId) : null
            },
            include: {
                teacher: true
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