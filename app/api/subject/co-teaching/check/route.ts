import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectId = Number(searchParams.get("subjectId"));

  if (!subjectId) {
    return NextResponse.json({ error: "กรุณาระบุ subjectId" }, { status: 400 });
  }

  const group = await prisma.coTeaching_tb.findFirst({
    where: {
      plans: {
        some: { id: subjectId },
      },
    },
    include: {
      plans: {
        select: {
          id: true,
          planType: true,
          yearLevel: true,
        },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ groupKey: null, planIds: [], details: [] });
  }

  return NextResponse.json({
    groupKey: group.groupKey,
    planIds: group.plans.map((p) => p.id),
    details: group.plans.map((p) => ({
      id: p.id,
      planType: p.planType,
      yearLevel: p.yearLevel,
    })),
  });
}
