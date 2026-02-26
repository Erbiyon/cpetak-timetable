import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const curricula = await prisma.curriculum_tb.findMany({
      orderBy: {
        id_sub: "asc",
      },
    });

    return NextResponse.json(curricula);
  } catch (error) {
    console.error("Error fetching curricula:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id_sub,
      subject_name,
      credit,
      lacture_credit,
      lab_credit,
      out_credit,
      curriculum_type,
    } = body;

    // ตรวจสอบว่ามีรหัสวิชาซ้ำหรือไม่
    const existingCurriculum = await prisma.curriculum_tb.findFirst({
      where: { id_sub },
    });

    if (existingCurriculum) {
      return NextResponse.json(
        { error: `รหัสวิชา ${id_sub} มีอยู่ในระบบแล้ว` },
        { status: 400 },
      );
    }

    const curriculum = await prisma.curriculum_tb.create({
      data: {
        id_sub,
        subject_name,
        credit,
        lacture_credit,
        lab_credit,
        out_credit,
        curriculum_type,
      },
    });

    return NextResponse.json(curriculum, { status: 201 });
  } catch (error) {
    console.error("Error creating curriculum:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
