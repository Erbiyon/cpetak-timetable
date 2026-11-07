import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { TeacherAuthService } from "@/features/teachers/services/teacher-auth.service";

/**
 * POST /api/teacher/enrollment/create
 * Generates an enrollment token for a teacher (Admin only).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { teacherId, validityHours } = body;

    if (!teacherId || typeof teacherId !== "number") {
      return NextResponse.json(
        { error: "Invalid or missing teacherId" },
        { status: 400 }
      );
    }

    const result = await TeacherAuthService.createEnrollmentToken(
      teacherId,
      validityHours || 24
    );

    return NextResponse.json({
      success: true,
      enrollmentToken: result.rawToken,
      expiresAt: result.expiresAt,
      teacherId: result.teacherId,
      tId: result.tId,
    });
  } catch (error: any) {
    console.error("Enrollment token creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create enrollment token" },
      { status: 500 }
    );
  }
}

