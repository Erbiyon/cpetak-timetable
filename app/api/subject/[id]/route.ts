import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireTeacherOrAdmin } from "@/lib/api-auth";
import { SubjectService } from "@/features/subjects/services/subject.service";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireTeacherOrAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;
    const planId = parseInt(id, 10);
    if (isNaN(planId)) {
      return NextResponse.json({ error: "ID วิชาไม่ถูกต้อง" }, { status: 400 });
    }

    const currentPlan = await prisma.plans_tb.findUnique({
      where: { id: planId },
    });

    if (!currentPlan) {
      return NextResponse.json({ error: "ไม่พบข้อมูลวิชาที่ระบุ" }, { status: 404 });
    }

    // Object-Level Authorization: Teachers can only update plans assigned to them
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
          { error: "คุณไม่มีสิทธิ์แก้ไขข้อมูลวิชาของอาจารย์ท่านอื่น (Forbidden: Ownership required)" },
          { status: 403 },
        );
      }
    }

    const body = await request.json();

    const updatedPlan = await SubjectService.patchSubject(planId, body);
    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  try {
    const id = parseInt(params.id, 10);

    const subject = await SubjectService.getSubjectById(id);

    if (!subject) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลวิชาที่ระบุ" },
        { status: 404 },
      );
    }

    return NextResponse.json(subject);
  } catch (error) {
    console.error("GET - ผิดพลาดในการดึงข้อมูลวิชา:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลวิชา" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const params = await context.params;
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID วิชาไม่ถูกต้อง" }, { status: 400 });
    }

    const existing = await prisma.plans_tb.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบข้อมูลวิชาที่ระบุ" }, { status: 404 });
    }

    const deletedSubject = await SubjectService.deleteSubject(id);

    return NextResponse.json({ success: true, deletedSubject });
  } catch (error) {
    console.error("DELETE - ผิดพลาดในการลบวิชา:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบวิชา" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const params = await context.params;
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID วิชาไม่ถูกต้อง" }, { status: 400 });
    }

    const body = await request.json();
    const {
      subjectCode,
      subjectName,
      credit,
      lectureHour,
      labHour,
      termYear,
      yearLevel,
      planType,
      dep,
    } = body;

    if (
      !subjectCode ||
      !subjectName ||
      !credit ||
      !termYear ||
      !yearLevel ||
      !planType ||
      !dep
    ) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 },
      );
    }

    const updatedSubject = await SubjectService.updateSubject(id, {
      subjectCode,
      subjectName,
      credit: Number(credit),
      lectureHour: Number(lectureHour),
      labHour: Number(labHour),
      yearLevel,
      planType,
      termYear,
      dep,
    });

    return NextResponse.json(updatedSubject, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
