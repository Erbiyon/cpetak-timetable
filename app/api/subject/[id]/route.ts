import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// PUT method - อัปเดตข้อมูลวิชา
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        const body = await request.json();

        // ตรวจสอบข้อมูลก่อนอัปเดต
        const existingSubject = await prisma.plans_tb.findUnique({
            where: { id },
            include: { room: true, teacher: true },
        });

        if (!existingSubject) {
            return NextResponse.json(
                { error: "ไม่พบข้อมูลวิชาที่ระบุ" },
                { status: 404 }
            );
        }

        // อัปเดตข้อมูล
        const updatedSubject = await prisma.plans_tb.update({
            where: { id },
            data: {
                roomId: body.roomId === null || body.roomId === "null" ? null : body.roomId,
                teacherId: body.teacherId === null || body.teacherId === "null" ? null : body.teacherId,
                section: body.section === null || body.section === "" ? null : body.section,
            },
            include: { room: true, teacher: true },
        });

        return NextResponse.json(updatedSubject);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update subject" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// GET method สำหรับดึงข้อมูลวิชาเดี่ยว
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // เปลี่ยนเป็น Promise
) {
    try {
        const resolvedParams = await params; // await params
        const id = parseInt(resolvedParams.id);

        console.log("GET - Fetching subject:", id);

        const subject = await prisma.plans_tb.findUnique({
            where: { id },
            include: {
                room: true,
                teacher: true,
            },
        });

        if (!subject) {
            return NextResponse.json(
                { error: "ไม่พบข้อมูลวิชาที่ระบุ" },
                { status: 404 }
            );
        }

        console.log("GET - Subject found:", {
            id: subject.id,
            subjectCode: subject.subjectCode,
            section: subject.section,
            roomId: subject.roomId,
            teacherId: subject.teacherId,
            room: subject.room,
            teacher: subject.teacher
        });

        return NextResponse.json(subject);
    } catch (error) {
        console.error("GET - Error fetching subject:", error);
        return NextResponse.json(
            { error: "Failed to fetch subject" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// DELETE method (ถ้าต้องการ)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // เปลี่ยนเป็น Promise
) {
    try {
        const resolvedParams = await params; // await params
        const id = parseInt(resolvedParams.id);

        console.log("DELETE - Deleting subject:", id);

        // ลบข้อมูลตารางเรียนที่เกี่ยวข้องก่อน
        await prisma.timetable_tb.deleteMany({
            where: { planId: id }
        });

        // ลบข้อมูลวิชา
        const deletedSubject = await prisma.plans_tb.delete({
            where: { id }
        });

        console.log("DELETE - Subject deleted successfully:", deletedSubject.id);

        return NextResponse.json({ success: true, deletedSubject });
    } catch (error) {
        console.error("DELETE - Error deleting subject:", error);
        return NextResponse.json(
            { error: "Failed to delete subject" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json();
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
            !credit ||
            // !lectureHour ||
            // !labHour ||
            !termYear ||
            !yearLevel ||
            !planType ||
            !dep
        ) {
            return NextResponse.json(
                { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            );
        }

        const newSubject = await prisma.plans_tb.update({
            where: { id: parseInt(id) },
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

        return NextResponse.json(newSubject, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}