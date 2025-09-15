import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    try {
        const id = parseInt(params.id)
        const body = await request.json()

        const existingSubject = await prisma.plans_tb.findUnique({
            where: { id },
            include: { room: true, teacher: true },
        })

        if (!existingSubject) {
            return NextResponse.json(
                { error: "ไม่พบข้อมูลวิชาที่ระบุ" },
                { status: 404 }
            )
        }

        const updatedSubject = await prisma.plans_tb.update({
            where: { id },
            data: {
                roomId: body.roomId === null || body.roomId === "null" ? null : body.roomId,
                teacherId: body.teacherId === null || body.teacherId === "null" ? null : body.teacherId,
                section: body.section === null || body.section === "" ? null : body.section,
            },
            include: { room: true, teacher: true },
        })

        return NextResponse.json(updatedSubject)
    } catch (error) {
        return NextResponse.json(
            { error: "ผิดพลาดในการอัปเดตวิชา" },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    try {
        const id = parseInt(params.id)

        console.log("GET - ดึงข้อมูลวิชา:", id)

        const subject = await prisma.plans_tb.findUnique({
            where: { id },
            include: {
                room: true,
                teacher: true,
            },
        })

        if (!subject) {
            return NextResponse.json(
                { error: "ไม่พบข้อมูลวิชาที่ระบุ" },
                { status: 404 }
            )
        }

        console.log("GET - วิชาที่พบ:", {
            id: subject.id,
            subjectCode: subject.subjectCode,
            section: subject.section,
            roomId: subject.roomId,
            teacherId: subject.teacherId,
            room: subject.room,
            teacher: subject.teacher,
        })

        return NextResponse.json(subject)
    } catch (error) {
        console.error("GET - ผิดพลาดในการดึงข้อมูลวิชา:", error)
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการดึงข้อมูลวิชา" },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    try {
        const id = parseInt(params.id)

        console.log("DELETE - ลบวิชา:", id)

        await prisma.timetable_tb.deleteMany({
            where: { planId: id },
        })

        const deletedSubject = await prisma.plans_tb.delete({
            where: { id },
        })

        console.log("DELETE - ลบวิชาเรียบร้อย:", deletedSubject.id)

        return NextResponse.json({ success: true, deletedSubject })
    } catch (error) {
        console.error("DELETE - ผิดพลาดในการลบวิชา:", error)
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการลบวิชา" },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const { id } = params;
    try {
        const body = await request.json()
        const {
            subjectCode,
            subjectName,
            credit,
            lectureHour,
            labHour,
            termYear,
            yearLevel,
            planType,
            dep,
        } = body

        if (
            !subjectCode ||
            !subjectName ||
            !credit ||
            !termYear ||
            !yearLevel ||
            !planType ||
            !dep
        ) {
            return NextResponse.json(
                { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            )
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
                dep,
            },
        })

        return NextResponse.json(newSubject, { status: 201 })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาด" },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}