import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherOrAdmin } from "@/lib/api-auth";
import { TimetableService } from "@/features/timetable/services/timetable.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const planId = parseInt(id);

    const timetable = await prisma.timetable_tb.findMany({
      where: { planId },
      include: {
        plan: {
          include: {
            teacher: true,
            room: true,
          },
        },
        teacher: true,
        room: true,
      },
    });

    return Response.json(timetable);
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return Response.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลตารางเรียน" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireTeacherOrAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;
    const planId = parseInt(id);

    if (isNaN(planId)) {
      return Response.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    console.log("Attempting to delete timetable for planId:", planId);

    const currentPlan = await prisma.plans_tb.findUnique({
      where: { id: planId },
    });

    if (!currentPlan) {
      return Response.json({ error: "Plan not found" }, { status: 404 });
    }

    // Object-Level Authorization: Teachers can only delete timetable entries for plans assigned to them
    if (auth.user.role === "teacher") {
      const authenticatedTeacherId = auth.user.teacherId;
      if (!authenticatedTeacherId) {
        return Response.json(
          { error: "ไม่พบข้อมูลอาจารย์ที่ล็อกอิน (Forbidden)" },
          { status: 403 },
        );
      }

      // Check if currentPlan is assigned to this teacher
      const teacherRecord = await prisma.teacher_tb.findFirst({
        where: { tId: authenticatedTeacherId },
      });

      if (!teacherRecord || currentPlan.teacherId !== teacherRecord.id) {
        return Response.json(
          { error: "คุณไม่มีสิทธิ์ลบตารางสอนของอาจารย์ท่านอื่น (Forbidden: Ownership required)" },
          { status: 403 },
        );
      }
    }

    const result = await TimetableService.deleteTimetable({
      planId,
      planRecord: currentPlan,
    });

    if (!result.success) {
      return Response.json(
        { error: result.error },
        { status: result.statusCode },
      );
    }

    return Response.json({
      message: result.message,
      deletedPlans: result.deletedPlans,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting timetable:", error);
    return Response.json(
      {
        error: "เกิดข้อผิดพลาดในการลบตารางเรียน",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
