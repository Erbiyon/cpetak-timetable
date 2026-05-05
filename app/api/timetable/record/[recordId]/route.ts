import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const record = await prisma.timetable_tb.findUnique({ where: { id } });
    if (!record) {
      return Response.json({ error: "Record not found" }, { status: 404 });
    }

    await prisma.timetable_tb.delete({ where: { id } });

    return Response.json({
      success: true,
      deletedId: id,
      planId: record.planId,
    });
  } catch (error) {
    console.error("Error deleting timetable record:", error);
    return Response.json(
      { error: "เกิดข้อผิดพลาดในการลบข้อมูล" },
      { status: 500 },
    );
  }
}
