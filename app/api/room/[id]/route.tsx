import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    try {
        const numId = Number(params.id);

        if (isNaN(numId)) {
            return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
        }

        const deleted = await prisma.room_tb.delete({
            where: { id: numId },
        });

        return NextResponse.json(deleted, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "ไม่พบห้องหรือเกิดข้อผิดพลาด" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const { id } = params;
    try {
        const body = await request.json();
        const { roomCode, roomType, roomCate } = body;
        const roomId = parseInt(id);

        if (!roomCode || !roomType) {
            return NextResponse.json(
                { error: "roomCode และ roomType เป็นข้อมูลที่จำเป็น" },
                { status: 400 }
            );
        }

        const updatedRoom = await prisma.room_tb.update({
            where: { id: roomId },
            data: {
                roomCode: roomCode.trim(),
                roomType: roomType.trim(),
                roomCate: roomCate || null,
            },
        });

        return NextResponse.json(updatedRoom);
    } catch (error) {
        console.error("ผิดพลาดในการอัปเดตห้อง:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการอัปเดตห้อง" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}