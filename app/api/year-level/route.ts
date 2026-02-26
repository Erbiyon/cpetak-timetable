import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const yearLevels = await prisma.yearLevel_tb.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(yearLevels);
}
