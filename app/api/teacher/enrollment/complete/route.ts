import { NextRequest, NextResponse } from "next/server";
import { TeacherAuthService } from "@/features/teachers/services/teacher-auth.service";

/**
 * POST /api/teacher/enrollment/complete
 * Completes teacher account enrollment with password setup.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    const result = await TeacherAuthService.completeEnrollment(token, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Enrollment failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ลงทะเบียนบัญชีอาจารย์และตั้งรหัสผ่านสำเร็จ",
    });
  } catch (error: any) {
    console.error("Enrollment completion error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลงทะเบียนบัญชี" },
      { status: 500 }
    );
  }
}

