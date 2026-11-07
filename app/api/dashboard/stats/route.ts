import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalTeachers, totalRooms, subjectGroups, planCounts] =
      await Promise.all([
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

    return NextResponse.json({
      totalTeachers,
      totalRooms,
      totalSubjects,
      activePlans,
      planBreakdown,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 },
    );
  }
}
