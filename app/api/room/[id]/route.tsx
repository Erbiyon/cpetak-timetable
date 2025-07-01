import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    try {
        const numId = Number(id);

        if (isNaN(numId)) {
            return NextResponse.json({ error: "Invalid id" }, { status: 400 });
        }

        const deleted = await prisma.room_tb.delete({
            where: { id: numId },
        });

        return NextResponse.json(deleted, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "ไม่พบห้องหรือเกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}