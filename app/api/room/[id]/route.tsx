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

        const deleted = await prisma.room_tb.delete({
            where: { id: numId },
        });

        return NextResponse.json(deleted, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "ไม่พบห้องหรือเกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { roomCode, roomType, roomCate } = body;
        const roomId = parseInt(params.id);

        if (!roomCode || !roomType) {
            return NextResponse.json(
                { error: "roomCode and roomType are required" },
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
        console.error("Error updating room:", error);
        return NextResponse.json(
            { error: "Failed to update room" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}