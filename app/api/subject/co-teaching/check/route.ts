import { NextResponse } from "next/server";
import { CoTeachingService } from "@/features/subjects/services/co-teaching.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectId = Number(searchParams.get("subjectId"));

  if (!subjectId) {
    return NextResponse.json({ error: "กรุณาระบุ subjectId" }, { status: 400 });
  }

  const result = await CoTeachingService.checkGroup(subjectId);
  return NextResponse.json(result);
}
