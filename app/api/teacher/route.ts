import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.tName || !body.tLastName) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อและนามสกุล" },
        { status: 400 },
      );
    }

    const teacherType = body.teacherType || "อาจารย์ภายนอกสาขา";

    let tId = body.tId;

    if (!tId && teacherType === "อาจารย์ภายในสาขา") {
      const existingTeachers = await prisma.teacher_tb.findMany({
        where: {
          teacherType: "อาจารย์ภายในสาขา",
          tId: {
            startsWith: "TCPE",
          },
        },
        orderBy: {
          tId: "asc",
        },
      });

      let maxNumber = 0;

      for (const teacher of existingTeachers) {
        const match = teacher.tId.match(/^TCPE(\d{2})$/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }

      const nextNumber = maxNumber + 1;

      if (nextNumber > 99) {
        return NextResponse.json(
          { error: "รหัสอาจารย์ภายในสาขาเต็มแล้ว (สูงสุดคือ TCPE99)" },
          { status: 400 },
        );
      }

      tId = `TCPE${nextNumber.toString().padStart(2, "0")}`;
    } else if (!tId && teacherType === "อาจารย์ภายนอกสาขา") {
      const existingTeachers = await prisma.teacher_tb.findMany({
        where: {
          teacherType: "อาจารย์ภายนอกสาขา",
          tId: {
            startsWith: "TOUT",
          },
        },
        orderBy: {
          tId: "asc",
        },
      });

      let maxNumber = 0;

      for (const teacher of existingTeachers) {
        const match = teacher.tId.match(/^TOUT(\d{1,3})$/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }

      const nextNumber = maxNumber + 1;

      if (nextNumber > 999) {
        return NextResponse.json(
          { error: "รหัสอาจารย์ภายนอกสาขาเต็มแล้ว (สูงสุดคือ TOUT999)" },
          { status: 400 },
        );
      }

      tId = `TOUT${nextNumber.toString().padStart(3, "0")}`;
    } else if (!tId) {
      tId = `T${Date.now()}`;
    }

    const existingTeacher = await prisma.teacher_tb.findFirst({
      where: { tId: tId },
    });

    if (existingTeacher) {
      return NextResponse.json(
        { error: `รหัสอาจารย์ ${tId} มีอยู่ในระบบแล้ว` },
        { status: 400 },
      );
    }

    const newTeacher = await prisma.teacher_tb.create({
      data: {
        tId: tId,
        tName: body.tName,
        tLastName: body.tLastName,
        teacherType: teacherType,
      },
    });

    return NextResponse.json(newTeacher, { status: 201 });
  } catch (error: any) {
    console.error("Error creating teacher:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการสร้างข้อมูลอาจารย์" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const inDepartment = url.searchParams.get("inDepartment") === "true";

    let teachers;

    if (inDepartment) {
      teachers = await prisma.teacher_tb.findMany({
        where: {
          teacherType: "อาจารย์ภายในสาขา",
        },
        orderBy: {
          tName: "asc",
        },
      });
    } else {
      teachers = await prisma.teacher_tb.findMany({
        orderBy: {
          tName: "asc",
        },
      });
    }

    return NextResponse.json(teachers);
  } catch (error: any) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch teachers" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
