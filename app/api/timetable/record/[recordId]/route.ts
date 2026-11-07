import { NextRequest } from "next/server";
import { TimetableService } from "@/features/timetable/services/timetable.service";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> },
) {
  try {
    const { recordId } = await params;
    const id = parseInt(recordId);

    if (isNaN(id)) {
      return Response.json({ error: "Invalid record ID" }, { status: 400 });
    }

    const result = await TimetableService.deleteTimetableRecord({ recordId: id });

    if (!result.success) {
      return Response.json(
        { error: result.error },
        { status: result.statusCode },
      );
    }

    return Response.json({
      success: true,
      deletedId: result.deletedId,
      planId: result.planId,
    });
  } catch (error) {
    console.error("Error deleting timetable record:", error);
    return Response.json(
      { error: "เกิดข้อผิดพลาดในการลบข้อมูล" },
      { status: 500 },
    );
  }
}
