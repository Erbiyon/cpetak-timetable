import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { SubjectService } from "@/features/subjects/services/subject.service";
import {
  validateCreateSubjectInput,
  validateUpdateSubjectInput,
} from "@/features/subjects/validations";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const validation = validateCreateSubjectInput(body);

    if (!validation.isValid || !validation.data) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 },
      );
    }

    const newSubject = await SubjectService.createSubject(validation.data);
    return NextResponse.json(newSubject, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const yearLevel = url.searchParams.get("yearLevel") || undefined;
  const termYear = url.searchParams.get("termYear") || undefined;
  const planType = url.searchParams.get("planType") || undefined;
  const dep = url.searchParams.get("dep") || undefined;

  try {
    const plans = await SubjectService.getSubjects({
      yearLevel,
      termYear,
      planType,
      dep,
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("ผิดพลาดในการดึงข้อมูลวิชา:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลวิชา" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const validation = validateUpdateSubjectInput(body);

    if (!validation.isValid || !validation.data) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 },
      );
    }

    const { id, ...data } = validation.data;
    const updatedSubject = await SubjectService.updateSubject(id, data);

    return NextResponse.json(updatedSubject);
  } catch (error) {
    console.error("ผิดพลาดในการอัปเดตวิชา:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตวิชา" },
      { status: 500 },
    );
  }
}
