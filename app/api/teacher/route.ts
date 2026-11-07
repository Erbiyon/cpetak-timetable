import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { TeacherService } from "@/features/teachers/services/teacher.service";
import { validateCreateTeacherInput } from "@/features/teachers/validations";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const validation = validateCreateTeacherInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: validation.error || "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const result = await TeacherService.createTeacher(validation.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json(result.teacher, { status: 201 });
  } catch (error: any) {
    console.error("Error creating teacher:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการสร้างข้อมูลอาจารย์" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const inDepartment = url.searchParams.get("inDepartment") === "true";

    const teachers = await TeacherService.getTeachers(inDepartment);

    return NextResponse.json(teachers);
  } catch (error: any) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}
