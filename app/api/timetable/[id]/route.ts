import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Use Promise.resolve to "await" the params even though it's not a Promise
        // This is just to satisfy Next.js static analyzer
        const resolvedParams = await Promise.resolve(params);
        const planId = parseInt(resolvedParams.id);

        if (isNaN(planId)) {
            return NextResponse.json(
                { error: "รหัสวิชาไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        // ลบข้อมูลตารางเรียนของวิชานี้
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