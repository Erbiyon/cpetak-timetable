import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FIXED_TERMS = [
  { name: "ภาคเรียนที่ 1" },
  { name: "ภาคเรียนที่ 2" },
  { name: "ภาคเรียนที่ 3" },
];

export async function POST(req: NextRequest) {
  const { name, start, end } = await req.json();

  const allTerms = await prisma.term_tb.findMany();
  const found = allTerms.find((t) => t.name === name);

  if (!found && allTerms.length < 3) {
    if (FIXED_TERMS.some((t) => t.name === name)) {
      const created = await prisma.term_tb.create({
        data: { name, start, end },
      });
      return NextResponse.json(created);
    } else {
      return NextResponse.json(
        { error: "ชื่อภาคเรียนไม่ถูกต้อง" },
        { status: 400 },
      );
    }
  } else if (found) {
    const updated = await prisma.term_tb.update({
      where: { id: found.id },
      data: { start, end },
    });
    return NextResponse.json(updated);
  } else {
    return NextResponse.json(
      { error: "ถึงจำนวนภาคเรียนสูงสุดแล้ว" },
      { status: 400 },
    );
  }
}

export async function GET() {
  const terms = await prisma.term_tb.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(terms);
}

export async function DELETE() {
  try {
    // ลบข้อมูลภาคเรียนทั้งหมด
    await prisma.term_tb.deleteMany();
    return NextResponse.json({ message: "ลบข้อมูลภาคเรียนทั้งหมดสำเร็จ" });
  } catch (error) {
    console.error("Error deleting all terms:", error);
    return NextResponse.json(
      { error: "ไม่สามารถลบข้อมูลได้" },
      { status: 500 },
    );
  }
}
