import { NextRequest, NextResponse } from "next/server";
import { TeacherAuthService } from "@/features/teachers/services/teacher-auth.service";

/**
 * POST /api/teacher/reset-password/request
 * Initiates password reset request. Returns generic success message to prevent account enumeration.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tId } = body;

    if (!tId || typeof tId !== "string") {
      return NextResponse.json(
        { error: "Invalid teacher ID" },
        { status: 400 }
      );
    }

    // Call service (returns null if unenrolled or non-existent)
    const result = await TeacherAuthService.createPasswordResetToken(tId);

    // Generic response to prevent account enumeration
    return NextResponse.json({
      success: true,
      message: "หากรหัสประจำตัวถูกต้อง ระบบได้ดำเนินการสร้างคำขอรีเซ็ตรหัสผ่านแล้ว",
      // Only include resetToken in development/test environment for verification
      ...(process.env.NODE_ENV !== "production" && result
        ? { devResetToken: result.rawToken }
        : {}),
    });
  } catch (error: any) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน" },
      { status: 500 }
    );
  }
}

