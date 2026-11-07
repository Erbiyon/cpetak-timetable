import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { CoTeachingService } from "@/features/subjects/services/co-teaching.service";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { groupKey, planIds } = await req.json();

    if (!groupKey || !Array.isArray(planIds) || planIds.length === 0) {
      return NextResponse.json(
        { error: "groupKey และ planIds เป็นข้อมูลที่จำเป็น" },
        { status: 400 },
      );
    }

    const result = await CoTeachingService.connectPlans(groupKey, planIds);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการรวมกลุ่มการสอน" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { groupKey, planIds } = await req.json();

    if (!groupKey || !Array.isArray(planIds)) {
      return NextResponse.json(
        { error: "groupKey และ planIds เป็นข้อมูลที่จำเป็น" },
        { status: 400 },
      );
    }

    const result = await CoTeachingService.disconnectPlans(groupKey, planIds);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการยกเลิกกลุ่มการสอน" },
      { status: 500 },
    );
  }
}
