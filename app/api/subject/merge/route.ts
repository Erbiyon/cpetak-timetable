import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { SubjectMergeService } from "@/features/subjects/services/subject-merge.service";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { subjectId } = await request.json();

    const result = await SubjectMergeService.mergeSubject(subjectId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode });
    }

    if (result.isCoTeaching) {
      return NextResponse.json({
        success: true,
        mergedSubjects: result.mergedSubjects,
        mergedSubject: result.mergedSubject,
        deletedParts: result.deletedParts,
        isCoTeaching: true,
      });
    }

    return NextResponse.json({
      success: true,
      mergedSubject: result.mergedSubject,
      deletedParts: result.deletedParts,
      isCoTeaching: false,
    });
  } catch (error) {
    console.error("ผิดพลาดในการรวมวิชา:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการรวมวิชา" },
      { status: 500 },
    );
  }
}
