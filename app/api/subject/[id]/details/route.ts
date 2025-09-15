import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {

        const { id: paramId } = await context.params;
        const id = parseInt(paramId, 10);
        if (isNaN(id)) {
            return NextResponse.json(
                { error: "รหัสวิชาไม่ถูกต้อง" },
                { status: 400 }
            );
        }


        const subject = await prisma.plans_tb.findUnique({
            where: { id }
        });

        if (!subject) {
            return NextResponse.json(
                { error: "ไม่พบวิชาที่ต้องการแก้ไข" },
                { status: 404 }
            );
        }


        const body = await req.json();
        console.log("ข้อมูลที่ได้รับ:", body);


        const updateData: any = {};


        if (body.roomId !== undefined) {
            updateData.roomId = body.roomId;
        }
        if (body.teacherId !== undefined) {
            updateData.teacherId = body.teacherId;
        }
        if (body.section !== undefined) {
            updateData.section = body.section;
        }


        const updatedSubject = await prisma.plans_tb.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedSubject);
    } catch (error: any) {
        console.error("ผิดพลาดในการอัปเดตข้อมูลวิชา:", error);
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูลวิชา" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}