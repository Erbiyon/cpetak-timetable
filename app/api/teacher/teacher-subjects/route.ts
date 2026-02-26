import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");
    const termYear = searchParams.get("termYear");

    if (!teacherId) {
      return NextResponse.json(
        { error: "Teacher ID is required" },
        { status: 400 },
      );
    }

    const subjects = await prisma.plans_tb.findMany({
      where: {
        teacherId: parseInt(teacherId),
        ...(termYear && { termYear: termYear }),
        dep: "ในสาขา",
      },
      include: {
        room: {
          select: {
            id: true,
            roomCode: true,
            roomType: true,
          },
        },
      },
      orderBy: [
        { planType: "asc" },
        { yearLevel: "asc" },
        { subjectCode: "asc" },
      ],
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching teacher subjects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
