import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { SubjectSplitService } from "@/features/subjects/services/subject-split.service";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { subjectId, splitData } = await request.json();

    const result = await SubjectSplitService.splitSubject(subjectId, splitData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode });
    }

    return NextResponse.json({
      success: true,
      updatedSubject: result.updatedSubject,
      newSubject: result.newSubject,
      allUpdatedSubjects: result.allUpdatedSubjects,
      allNewSubjects: result.allNewSubjects,
      isCoTeaching: result.isCoTeaching,
    });
  } catch (error) {
    console.error("ผิดพลาดในการแบ่งวิชา:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแบ่งวิชา" },
      { status: 500 },
    );
  }
}
