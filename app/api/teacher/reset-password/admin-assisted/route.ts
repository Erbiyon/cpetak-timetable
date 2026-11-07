import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { TeacherAuthService } from "@/features/teachers/services/teacher-auth.service";

/**
 * POST /api/teacher/reset-password/admin-assisted
 * Admin-assisted recovery workflow:
 * Requires verified Admin session and identity verification procedure.
 * Issues a single-use password reset token for the specified teacher.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { teacherId, validityMinutes } = body;

    if (!teacherId || typeof teacherId !== "number") {
      return NextResponse.json(
        { error: "Invalid or missing teacherId" },
        { status: 400 }
      );
    }

    const result = await TeacherAuthService.createAdminAssistedResetToken(
      teacherId,
      validityMinutes || 60
    );

    return NextResponse.json({
      success: true,
      resetToken: result.rawToken,
      expiresAt: result.expiresAt,
      teacherId: result.teacherId,
    });
  } catch (error: any) {
    console.error("Admin-assisted password reset error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create reset token" },
      { status: 500 }
    );
  }
}

