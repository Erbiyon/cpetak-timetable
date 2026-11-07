import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { CurriculumService } from "@/features/curriculum/services/curriculum.service";
import { validateCurriculumInput } from "@/features/curriculum/validations";

export async function GET(_req: NextRequest) {
  try {
    const curricula = await CurriculumService.getAllCurricula();
    return NextResponse.json(curricula);
  } catch (error) {
    console.error("Error fetching curricula:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const validation = validateCurriculumInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: validation.error || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const result = await CurriculumService.createCurriculum(validation.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json(result.curriculum, { status: 201 });
  } catch (error) {
    console.error("Error creating curriculum:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล" },
      { status: 500 }
    );
  }
}
