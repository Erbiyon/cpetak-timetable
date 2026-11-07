import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherOrAdmin } from "@/lib/api-auth";
import { TimetableService } from "@/features/timetable/services/timetable.service";

export async function POST(request: Request) {
  try {
    const auth = await requireTeacherOrAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();
    const {
      planId,
      termYear,
      yearLevel,
      planType,
      day,
      startPeriod,
      endPeriod,
      roomId,
      teacherId,
      section,
    } = body;

    // Object-Level Authorization: If logged in as Teacher, verify teacher can only schedule for themselves
    if (auth.user.role === "teacher") {
      const authenticatedTeacherId = auth.user.teacherId;
      if (!authenticatedTeacherId) {
        return Response.json(
          { error: "ไม่พบข้อมูลอาจารย์ที่ล็อกอิน (Forbidden)" },
          { status: 403 },
        );
      }

      const teacherRecord = await prisma.teacher_tb.findFirst({
        where: { tId: authenticatedTeacherId },
      });

      if (!teacherRecord) {
        return Response.json(
          { error: "ไม่พบบัญชีอาจารย์ในระบบ (Forbidden)" },
          { status: 403 },
        );
      }

      // If a teacherId is passed in body, it must match the authenticated teacher
      if (teacherId && teacherId !== teacherRecord.id) {
        return Response.json(
          { error: "คุณไม่มีสิทธิ์จัดตารางสอนให้อาจารย์ท่านอื่น (Forbidden: Ownership required)" },
          { status: 403 },
        );
      }

      // Check plan ownership: verify the plan being scheduled belongs to this teacher
      if (planId) {
        const plan = await prisma.plans_tb.findUnique({
          where: { id: planId },
        });
        if (plan && plan.teacherId && plan.teacherId !== teacherRecord.id) {
          return Response.json(
            { error: "วิชานี้เป็นของอาจารย์ท่านอื่น คุณไม่สามารถจัดตารางแทนได้ (Forbidden: Ownership required)" },
            { status: 403 },
          );
        }
      }
    }

    const result = await TimetableService.createTimetable({
      planId: Number(planId),
      termYear,
      yearLevel,
      planType,
      day: Number(day),
      startPeriod: Number(startPeriod),
      endPeriod: Number(endPeriod),
      roomId: roomId ? Number(roomId) : null,
      teacherId: teacherId ? Number(teacherId) : null,
      section: section || null,
    });

    if (!result.success) {
      if (result.conflicts) {
        return Response.json({ conflicts: result.conflicts }, { status: result.statusCode });
      }
      return Response.json({ error: result.error }, { status: result.statusCode });
    }

    return Response.json(result.timetable);
  } catch (error) {
    console.error("Error creating timetable:", error);
    return Response.json(
      { error: "เกิดข้อผิดพลาดในการสร้างตารางเรียน" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const roomIdParam = url.searchParams.get("roomId");
    const teacherIdParam = url.searchParams.get("teacherId");
    const termYear = url.searchParams.get("termYear");
    const yearLevel = url.searchParams.get("yearLevel");
    const planType = url.searchParams.get("planType");

    if (roomIdParam) {
      const roomId = parseInt(roomIdParam);
      if (isNaN(roomId)) {
        return NextResponse.json(
          { error: "Invalid roomId parameter" },
          { status: 400 },
        );
      }

      const whereClause: any = { roomId };
      if (termYear) whereClause.termYear = termYear;

      const timetables = await prisma.timetable_tb.findMany({
        where: whereClause,
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
        orderBy: [{ day: "asc" }, { startPeriod: "asc" }],
      });

      return NextResponse.json(timetables);
    }

    if (teacherIdParam) {
      const teacherId = parseInt(teacherIdParam);
      if (isNaN(teacherId)) {
        return NextResponse.json(
          { error: "Invalid teacherId parameter" },
          { status: 400 },
        );
      }

      const whereClause: any = { teacherId };
      if (termYear) whereClause.termYear = termYear;

      const timetables = await prisma.timetable_tb.findMany({
        where: whereClause,
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
        orderBy: [{ day: "asc" }, { startPeriod: "asc" }],
      });

      return NextResponse.json(timetables);
    }

    const whereClause: any = {};
    if (termYear) whereClause.termYear = termYear;
    if (yearLevel) whereClause.yearLevel = yearLevel;
    if (planType) whereClause.planType = planType;

    const timetables = await prisma.timetable_tb.findMany({
      where: whereClause,
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
      orderBy: [{ day: "asc" }, { startPeriod: "asc" }],
    });

    return NextResponse.json(timetables);
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลตารางเรียน" },
      { status: 500 },
    );
  }
}
