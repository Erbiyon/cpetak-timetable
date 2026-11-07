import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { TimetableService } from "@/features/timetable/services/timetable.service";

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();
    const { termYear, yearLevel, planType } = body;

    const result = await TimetableService.clearTimetable({
      termYear,
      yearLevel,
      planType,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode },
      );
    }

    return NextResponse.json({
      message: result.message,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing timetable:", error);
    return NextResponse.json(
      { error: "Failed to clear timetable" },
      { status: 500 },
    );
  }
}
