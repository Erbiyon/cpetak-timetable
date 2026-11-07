import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { TeacherService } from "@/features/teachers/services/teacher.service";
import { validateUpdateTeacherInput } from "@/features/teachers/validations";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const teacherId = parseInt(id);

    if (isNaN(teacherId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const teacher = await TeacherService.getTeacherById(teacherId);

    if (!teacher) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลอาจารย์" },
        { status: 404 }
      );
    }

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();
    const validation = validateUpdateTeacherInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: validation.error || "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const result = await TeacherService.updateTeacher(numId, validation.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json(result.teacher, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const result = await TeacherService.deleteTeacher(numId);

    return NextResponse.json(result.deletedTeacher, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
