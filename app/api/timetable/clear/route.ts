import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();
    const { termYear, yearLevel, planType } = body;

    if (!termYear || !yearLevel || !planType) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const deletedCount = await prisma.timetable_tb.deleteMany({
      where: {
        termYear,
        yearLevel,
        planType,
      },
    });

    return NextResponse.json({
      message: "All subjects cleared from timetable",
      deletedCount: deletedCount.count,
    });
  } catch (error) {
    console.error("Error clearing timetable:", error);
    return NextResponse.json(
      { error: "Failed to clear timetable" },
      { status: 500 },
    );
  }
}
