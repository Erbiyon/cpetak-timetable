import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const planId = parseInt(id);

        if (isNaN(planId)) {
            return NextResponse.json(
                { error: "รหัสวิชาไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        await prisma.timetable_tb.deleteMany({
            where: { planId }
        });

        return NextResponse.json({ message: "ลบข้อมูลสำเร็จ" });
    } catch (error: any) {
        console.error("Error deleting timetable:", error);
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาดในการลบข้อมูล" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}