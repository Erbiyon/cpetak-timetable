import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const termYear = await prisma.termYear_tb.findFirst({
      where: { id: 1 },
    });

    if (!termYear) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลภาคเรียน" },
        { status: 404 },
      );
    }

    return NextResponse.json(termYear);
  } catch (error: any) {
    console.error("ผิดพลาดในการดึงข้อมูลภาคเรียนปัจจุบัน:", error);
    return NextResponse.json(
      { error: "ผิดพลาดในการดึงข้อมูลภาคเรียนปัจจุบัน" },
      { status: 500 },
    );
  }
}
