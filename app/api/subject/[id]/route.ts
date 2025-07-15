import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    try {
        const numId = Number(id);
        if (isNaN(numId)) {
            return NextResponse.json({ error: "Invalid id" }, { status: 400 });
        }

        const deleted = await prisma.plans_tb.delete({
            where: { id: numId },
        });

        return NextResponse.json(deleted, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const numId = Number(id);
        if (isNaN(numId)) {
            return NextResponse.json({ error: "Invalid id" }, { status: 400 });
        }

        const body = await request.json();
        const {
            subjectCode,
            subjectName,
            credit,
            lectureHour,
            labHour,
            termYear,
            yearLevel,
            planType,
            dep
        } = body;

        if (
            !subjectCode ||
            !subjectName ||
            credit == null || credit === '' ||
            lectureHour == null || lectureHour === '' ||
            labHour == null || labHour === '' ||
            !termYear ||
            !yearLevel ||
            !planType ||
            (dep !== "นอกสาขา" && dep !== "วิชาในสาขา")
        ) {
            return NextResponse.json(
                { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            );
        }

        const updatedSubject = await prisma.plans_tb.update({
            where: { id: numId },
            data: {
                subjectCode,
                subjectName,
                credit: Number(credit),
                lectureHour: Number(lectureHour),
                labHour: Number(labHour),
                yearLevel,
                planType,
                termYear,
                dep
            },
        });

        return NextResponse.json(updatedSubject, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: { id: string } }
) {
    try {
        const id = context.params.id;
        const subjectId = parseInt(id);

        if (isNaN(subjectId)) {
            return NextResponse.json(
                { error: "รหัสวิชาไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        // รับข้อมูลที่จะอัปเดต
        const data = await req.json();

        // สร้าง object เฉพาะฟิลด์ที่ต้องการอัปเดต
        const updateData: any = {};

        // เพิ่มข้อมูล roomId และ teacherId ตามที่ระบุ
        if (data.hasOwnProperty('roomId')) {
            updateData.roomId = data.roomId;
        }

        if (data.hasOwnProperty('teacherId')) {
            updateData.teacherId = data.teacherId;
        }

        // เพิ่มการอัปเดตฟิลด์ section ในตาราง Plans_tb
        if (data.hasOwnProperty('section')) {
            updateData.section = data.section;
        }

        console.log("อัปเดตข้อมูล Plans_tb:", {
            subjectId,
            updateData
        });

        // อัปเดตข้อมูลในตาราง Plans_tb
        const updatedSubject = await prisma.plans_tb.update({
            where: { id: subjectId },
            data: updateData,
            include: {
                room: true,
                teacher: true
            }
        });

        // ถ้ามีการอัปเดต section ให้อัปเดต Timetable_tb ด้วย
        if (data.hasOwnProperty('section')) {
            // อัปเดตทุกรายการในตาราง Timetable_tb ที่เกี่ยวข้องกับ planId นี้
            await prisma.timetable_tb.updateMany({
                where: { planId: subjectId },
                data: { section: data.section }
            });
        }

        return NextResponse.json(updatedSubject);
    } catch (error: any) {
        console.error("Error updating subject:", error);
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}