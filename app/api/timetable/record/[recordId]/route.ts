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

    const record = await prisma.timetable_tb.findUnique({
      where: { id },
      include: { plan: true },
    });
    if (!record) {
      return Response.json({ error: "Record not found" }, { status: 404 });
    }

    await prisma.timetable_tb.delete({ where: { id } });

    // DVE Term 3: sync ลบ record ที่ตรงกันในแผนคู่ (LVC ↔ MSIX)
    const isDVE =
      record.planType === "DVE-LVC" || record.planType === "DVE-MSIX";
    const isTerm3 =
      typeof record.termYear === "string" && record.termYear.startsWith("3/");

    if (isDVE && isTerm3 && record.plan) {
      const isSplitSubject = record.plan.subjectName?.includes("(ส่วนที่");
      const duplicatePlans = await prisma.plans_tb.findMany({
        where: isSplitSubject
          ? {
              subjectCode: record.plan.subjectCode,
              subjectName: record.plan.subjectName,
              termYear: record.plan.termYear,
              yearLevel: record.plan.yearLevel,
              NOT: { id: record.planId },
            }
          : {
              subjectCode: record.plan.subjectCode,
              termYear: record.plan.termYear,
              yearLevel: record.plan.yearLevel,
              NOT: { id: record.planId },
            },
      });

      for (const dup of duplicatePlans) {
        await prisma.timetable_tb.deleteMany({
          where: {
            planId: dup.id,
            day: record.day,
            startPeriod: record.startPeriod,
            endPeriod: record.endPeriod,
          },
        });
      }
    }

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
