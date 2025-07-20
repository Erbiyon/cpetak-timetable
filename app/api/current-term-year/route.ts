import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        // ดึงข้อมูลภาคเรียนจากตาราง TermYear_tb 
        // โดยปกติจะมี record เดียวที่ id = 1
        const termYear = await prisma.termYear_tb.findFirst({
            where: { id: 1 }
        });

        if (!termYear) {
            return NextResponse.json(
                { error: "ไม่พบข้อมูลภาคเรียน" },
                { status: 404 }
            );
        }

        return NextResponse.json(termYear);
    } catch (error: any) {
        console.error("Error fetching current term year:", error);
        return NextResponse.json(
            { error: "Failed to fetch current term year" },
            { status: 500 }
        );
    }
}