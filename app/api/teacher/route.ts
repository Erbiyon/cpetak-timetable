import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const { tName, tLastName } = await req.json();

    const lastTeacher = await prisma.teacher_tb.findFirst({
        orderBy: { id: "desc" },
        select: { tId: true },
    });

    let nextNumber = 1;
    if (lastTeacher?.tId) {
        const lastNum = parseInt(lastTeacher.tId.replace("TCPE", ""), 10);
        nextNumber = lastNum + 1;
    }

    const tId = `TCPE${nextNumber.toString().padStart(2, "0")}`;

    const newTeacher = await prisma.teacher_tb.create({
        data: { tId, tName, tLastName },
    });

    return NextResponse.json(newTeacher);
}

export async function GET() {
    const terms = await prisma.teacher_tb.findMany({
        orderBy: { id: "asc" }
    })
    return NextResponse.json(terms)
}