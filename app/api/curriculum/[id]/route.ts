import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    // ตรวจสอบว่ามีรหัสวิชาซ้ำหรือไม่ (ยกเว้นตัวเอง)
    const existingCurriculum = await prisma.curriculum_tb.findFirst({
      where: {
        id_sub,
        NOT: { id },
      },
    });

    if (existingCurriculum) {
      return NextResponse.json(
        { error: `รหัสวิชา ${id_sub} มีอยู่ในระบบแล้ว` },
        { status: 400 },
      );
    }

    const curriculum = await prisma.curriculum_tb.update({
      where: { id },
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

    return NextResponse.json(curriculum);
  } catch (error) {
    console.error("Error updating curriculum:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    await prisma.curriculum_tb.delete({
      where: { id },
    });

    return NextResponse.json({ message: "ลบข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error deleting curriculum:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบข้อมูล" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
