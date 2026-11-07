import { NextRequest, NextResponse } from "next/server";
import { requireTeacherOrAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireTeacherOrAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { subjectId, roomId } = await request.json();

    if (!subjectId) {
      return NextResponse.json({ error: "กรุณาระบุรหัสวิชา" }, { status: 400 });
    }

    const currentPlan = await prisma.plans_tb.findUnique({
      where: { id: Number(subjectId) },
    });

    if (!currentPlan) {
      return NextResponse.json({ error: "ไม่พบข้อมูลวิชาที่ระบุ" }, { status: 404 });
    }

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
      where: { id: Number(subjectId) },
      data: {
        roomId: roomId ? Number(roomId) : null,
      },
      include: {
        room: true,
      },
    });

    return NextResponse.json(updatedSubject, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const subjects = await prisma.plans_tb.findMany({
      include: {
        room: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    return NextResponse.json(
      { error: "ดึงข้อมูลวิชาไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
