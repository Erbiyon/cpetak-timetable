import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;
    const subjectId = parseInt(id, 10);
    const { teacherId } = await request.json();

    if (isNaN(subjectId)) {
      return NextResponse.json({ error: "ID วิชาไม่ถูกต้อง" }, { status: 400 });
    }

    const updatedSubject = await prisma.plans_tb.update({
      where: { id: subjectId },
      data: { teacherId: teacherId ? Number(teacherId) : null },
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
    console.error("ผิดพลาดในการอัปเดตอาจารย์ของวิชา:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 },
    );
  }
}
