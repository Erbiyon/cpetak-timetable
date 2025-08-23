import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const subjectId = Number(searchParams.get("subjectId"));

    if (!subjectId) {
        return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
    }

    // หา group ที่ subjectId นี้อยู่
    const group = await prisma.coTeaching_tb.findFirst({
        where: {
            plans: {
                some: { id: subjectId }
            }
        },
        include: {
            plans: { select: { id: true } }
        }
    });

    if (!group) {
        return NextResponse.json({ groupKey: null, planIds: [] });
    }

    return NextResponse.json({
        groupKey: group.groupKey,
        planIds: group.plans.map(p => p.id)
    });
}