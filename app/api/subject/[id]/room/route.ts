import { NextRequest, NextResponse } from "next/server";
import { requireTeacherOrAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireTeacherOrAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;
    const subjectId = parseInt(id, 10);
    const { roomId } = await request.json();

    if (isNaN(subjectId)) {
      return NextResponse.json({ error: "ID วิชาไม่ถูกต้อง" }, { status: 400 });
    }

    const currentPlan = await prisma.plans_tb.findUnique({
      where: { id: subjectId },
    });

    if (!currentPlan) {
      return NextResponse.json({ error: "ไม่พบข้อมูลวิชาที่ระบุ" }, { status: 404 });
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

      if (!teacherRecord || currentPlan.teacherId !== teacherRecord.id) {
        return NextResponse.json(
          { error: "คุณไม่มีสิทธิ์กำหนดห้องเรียนของวิชาที่สอนโดยอาจารย์ท่านอื่น (Forbidden: Ownership required)" },
          { status: 403 },
        );
      }
    }

    const updatedSubject = await prisma.plans_tb.update({
      where: { id: subjectId },
      data: { roomId: roomId ? Number(roomId) : null },
      include: {
        room: {
          select: {
            id: true,
            roomCode: true,
            roomType: true,
          },
        },
        teacher: {
          select: {
            id: true,
            tName: true,
            tLastName: true,
            tId: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSubject);
  } catch (error) {
    console.error("ผิดพลาดในการอัปเดตห้องเรียนของวิชา:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 },
    );
  }
}
