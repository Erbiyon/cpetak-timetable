import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalTeachers = await prisma.teacher_tb.count();

    const totalRooms = await prisma.room_tb.count();

    const totalSubjects = await prisma.plans_tb
      .groupBy({
        by: ["subjectCode"],
        _count: {
          subjectCode: true,
        },
      })
      .then((result) => result.length);

    const transferPlanCount = await prisma.plans_tb.count({
      where: { planType: "TRANSFER" },
    });
    const fourYearPlanCount = await prisma.plans_tb.count({
      where: { planType: "FOUR_YEAR" },
    });
    const dveLvcPlanCount = await prisma.plans_tb.count({
      where: { planType: "DVE-LVC" },
    });
    const dveMsixPlanCount = await prisma.plans_tb.count({
      where: { planType: "DVE-MSIX" },
    });

    const activePlans =
      transferPlanCount +
      fourYearPlanCount +
      dveLvcPlanCount +
      dveMsixPlanCount;

    return NextResponse.json({
      totalTeachers,
      totalRooms,
      totalSubjects,
      activePlans,
      planBreakdown: {
        transfer: transferPlanCount,
        fourYear: fourYearPlanCount,
        dveLvc: dveLvcPlanCount,
        dveMsix: dveMsixPlanCount,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 },
    );
  }
}
