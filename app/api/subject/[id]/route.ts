import { NextRequest, NextResponse } from "next/server";
import { SubjectService } from "@/features/subjects/services/subject.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const planId = parseInt(id);
    const body = await request.json();

    const updatedPlan = await SubjectService.patchSubject(planId, body);
    return Response.json(updatedPlan);
  } catch (error) {
    console.error("Error updating plan:", error);
    return Response.json(
      { error: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  try {
    const id = parseInt(params.id);

    const subject = await SubjectService.getSubjectById(id);

    if (!subject) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลวิชาที่ระบุ" },
        { status: 404 },
      );
    }

    return NextResponse.json(subject);
  } catch (error) {
    console.error("GET - ผิดพลาดในการดึงข้อมูลวิชา:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลวิชา" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  try {
    const id = parseInt(params.id);

    const deletedSubject = await SubjectService.deleteSubject(id);

    return NextResponse.json({ success: true, deletedSubject });
  } catch (error) {
    console.error("DELETE - ผิดพลาดในการลบวิชา:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบวิชา" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id } = params;
  try {
    const body = await request.json();
    const {
      subjectCode,
      subjectName,
      credit,
      lectureHour,
      labHour,
      termYear,
      yearLevel,
      planType,
      dep,
    } = body;

    if (
      !subjectCode ||
      !subjectName ||
      !credit ||
      !termYear ||
      !yearLevel ||
      !planType ||
      !dep
    ) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 },
      );
    }

    const updatedSubject = await SubjectService.updateSubject(parseInt(id), {
      subjectCode,
      subjectName,
      credit: Number(credit),
      lectureHour: Number(lectureHour),
      labHour: Number(labHour),
      yearLevel,
      planType,
      termYear,
      dep,
    });

    return NextResponse.json(updatedSubject, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
