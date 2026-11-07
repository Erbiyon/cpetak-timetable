import { NextRequest, NextResponse } from "next/server";
import { TeacherAuthService } from "@/features/teachers/services/teacher-auth.service";

/**
 * POST /api/teacher/reset-password/confirm
 * Confirms password reset using single-use token and new password.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    const result = await TeacherAuthService.resetPassword(token, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Password reset failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่",
    });
  } catch (error: any) {
    console.error("Password reset confirmation error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน" },
      { status: 500 }
    );
  }
}

