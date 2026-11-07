import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { CurriculumService } from "@/features/curriculum/services/curriculum.service";
import { validateCurriculumInput } from "@/features/curriculum/validations";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validation = validateCurriculumInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: validation.error || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const result = await CurriculumService.updateCurriculum(id, validation.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json(result.curriculum);
  } catch (error) {
    console.error("Error updating curriculum:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    await CurriculumService.deleteCurriculum(id);

    return NextResponse.json({ message: "ลบข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error deleting curriculum:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบข้อมูล" },
      { status: 500 },
    );
  }
}
