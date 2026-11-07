import { NextResponse } from "next/server";
import { CoTeachingService } from "@/features/subjects/services/co-teaching.service";

export async function POST(req: Request) {
  const { groupKey, planIds } = await req.json();
  const result = await CoTeachingService.connectPlans(groupKey, planIds);
  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const { groupKey, planIds } = await req.json();
  const result = await CoTeachingService.disconnectPlans(groupKey, planIds);
  return NextResponse.json(result);
}
