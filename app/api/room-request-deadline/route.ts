import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const deadline = await prisma.roomRequestDeadline_tb.findUnique({
      where: { id: 1 },
    });

    return NextResponse.json(deadline);
  } catch (error) {
    console.error("Error fetching room request deadline:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deadline } = body;

    if (!deadline) {
      return NextResponse.json(
        { error: "กรุณาระบุวันที่กำหนด" },
        { status: 400 }
      );
    }

    const result = await prisma.roomRequestDeadline_tb.upsert({
      where: { id: 1 },
      update: { deadline: new Date(deadline) },
      create: { id: 1, deadline: new Date(deadline) },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error setting room request deadline:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
