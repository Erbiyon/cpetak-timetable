import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const rooms = await prisma.room_tb.findMany({
            select: {
                id: true,
                roomCode: true,
                roomType: true,
                roomCate: true,
            },
            orderBy: {
                roomCode: 'asc'
            }
        });

        return NextResponse.json(rooms);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return NextResponse.json(
            { error: "Failed to fetch rooms" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { roomCode, roomType, roomCate } = body;

        console.log("Received data:", { roomCode, roomType, roomCate }); // เพิ่ม log เพื่อ debug

        if (!roomCode || !roomType) {
            return NextResponse.json(
                { error: "roomCode and roomType are required" },
                { status: 400 }
            );
        }

        const room = await prisma.room_tb.create({
            data: {
                roomCode: roomCode.trim(),
                roomType: roomType.trim(),
                roomCate: roomCate || null, // ใช้ null หากไม่มีค่า
            },
        });

        console.log("Created room:", room); // เพิ่ม log เพื่อ debug

        return NextResponse.json(room, { status: 201 });
    } catch (error) {
        console.error("Error creating room:", error);
        return NextResponse.json(
            { error: "Failed to create room" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}