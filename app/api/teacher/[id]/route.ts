import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const numId = Number(id);
        if (isNaN(numId)) {
            return NextResponse.json({ error: "Invalid id" }, { status: 400 });
        }

        const body = await request.json();
        const { tName, tLastName } = body;

        if (!tName || !tLastName) {
            return NextResponse.json(
                { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            );
        }

        const updatedTeacher = await prisma.teacher_tb.update({
            where: { id: numId },
            data: {
                tName,
                tLastName,
            },
        });

        return NextResponse.json(updatedTeacher, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const numId = Number(id);
        if (isNaN(numId)) {
            return NextResponse.json({ error: "Invalid id" }, { status: 400 });
        }

        const deleted = await prisma.teacher_tb.delete({
            where: { id: numId },
        });

        return NextResponse.json(deleted, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}