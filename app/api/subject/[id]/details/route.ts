import { NextRequest, NextResponse } from "next/server";
import { requireTeacherOrAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireTeacherOrAdmin(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id: paramId } = await context.params;
    const id = parseInt(paramId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "รหัสวิชาไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const subject = await prisma.plans_tb.findUnique({
      where: { id },
    });

    if (!subject) {
      return NextResponse.json(
        { error: "ไม่พบวิชาที่ต้องการแก้ไข" },
        { status: 404 },
      );
    }

    // Ownership check for Teachers
    if (auth.user.role === "teacher") {
      const authenticatedTeacherId = auth.user.teacherId;
      if (!authenticatedTeacherId) {
        return NextResponse.json(
          { error: "ไม่พบข้อมูลอาจารย์ที่ล็อกอิน (Forbidden)" },
          { status: 403 },
        );
      }

      const teacherRecord = await prisma.teacher_tb.findFirst({
        where: { tId: authenticatedTeacherId },
      });

      if (!teacherRecord || subject.teacherId !== teacherRecord.id) {
        return NextResponse.json(
          { error: "คุณไม่มีสิทธิ์แก้ไขข้อมูลวิชาของอาจารย์ท่านอื่น (Forbidden: Ownership required)" },
          { status: 403 },
        );
      }
    }

    const body = await req.json();

    const updateData: any = {};

    if (body.roomId !== undefined) {
      updateData.roomId = body.roomId;
    }
    // Only Admin can reassign teacherId on details endpoint
    if (body.teacherId !== undefined && auth.user.role === "admin") {
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
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการแก้ไขข้อมูลวิชา" },
      { status: 500 },
    );
  }
}
