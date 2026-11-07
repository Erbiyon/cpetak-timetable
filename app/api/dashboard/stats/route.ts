import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const currentTermYearRecord = await prisma.termYear_tb.findFirst();
    const currentTermYear = currentTermYearRecord?.termYear || "";

    const [
      totalTeachers,
      totalRooms,
      subjectGroups,
      planCounts,
      totalAssignedPlans,
      utilizedRoomsCount,
      scheduledTimetableSlots,
    ] = await Promise.all([
      prisma.teacher_tb.count(),
      prisma.room_tb.count(),
      prisma.plans_tb.groupBy({
        by: ["subjectCode"],
        _count: {
          subjectCode: true,
        },
      }),
      prisma.plans_tb.groupBy({
        by: ["planType"],
        _count: {
          _all: true,
        },
      }),
      // นับจำนวน plans ที่ได้รับการจัดตารางแล้ว
      prisma.timetable_tb.groupBy({
        by: ["planId"],
        _count: {
          planId: true,
        },
      }),
      // นับจำนวนห้องเรียนที่มีตารางการใช้งานจริง
      prisma.timetable_tb.groupBy({
        by: ["roomId"],
        where: {
          roomId: { not: null },
        },
      }),
      // นับจำนวนช่วงเวลา slot ที่มีการจัดตาราง
      prisma.timetable_tb.count(),
    ]);

    const totalSubjects = subjectGroups.length;

    const planBreakdown = {
      transfer: 0,
      fourYear: 0,
      dveLvc: 0,
      dveMsix: 0,
    };

    for (const item of planCounts) {
      if (item.planType === "TRANSFER") {
        planBreakdown.transfer = item._count._all;
      } else if (item.planType === "FOUR_YEAR") {
        planBreakdown.fourYear = item._count._all;
      } else if (item.planType === "DVE-LVC") {
        planBreakdown.dveLvc = item._count._all;
      } else if (item.planType === "DVE-MSIX") {
        planBreakdown.dveMsix = item._count._all;
      }
    }

    const activePlans =
      planBreakdown.transfer +
      planBreakdown.fourYear +
      planBreakdown.dveLvc +
      planBreakdown.dveMsix;

    const assignedPlansCount = totalAssignedPlans.length;
    const unassignedPlansCount = Math.max(0, activePlans - assignedPlansCount);
    const schedulingProgressPercent =
      activePlans > 0
        ? Math.round((assignedPlansCount / activePlans) * 100)
        : 0;

    return NextResponse.json({
      totalTeachers,
      totalRooms,
      totalSubjects,
      activePlans,
      planBreakdown,
      currentTermYear,
      assignedPlansCount,
      unassignedPlansCount,
      schedulingProgressPercent,
      utilizedRoomsCount: utilizedRoomsCount.length,
      scheduledTimetableSlots,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 },
    );
  }
}
