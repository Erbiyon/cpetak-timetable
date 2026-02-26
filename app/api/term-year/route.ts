import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { termYear } = await req.json();
  const config = await prisma.termYear_tb.upsert({
    where: { id: 1 },
    update: { termYear },
    create: { id: 1, termYear },
  });
  return NextResponse.json(config);
}

export async function GET() {
  const terms = await prisma.termYear_tb.findFirst({
    orderBy: { termYear: "asc" },
  });
  return NextResponse.json(terms);
}
