import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const firstName = url.searchParams.get('firstName');
        const lastName = url.searchParams.get('lastName');

        if (!firstName || !lastName) {
            return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
        }

        const teacher = await prisma.teacher_tb.findFirst({
            where: {
                tName: firstName,
                tLastName: lastName
            }
        });

        return NextResponse.json(teacher || null, { status: 200 });
    } catch (error: any) {
        console.error("Error finding teacher:", error);
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}