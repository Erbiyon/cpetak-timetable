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
        console.error("ผิดพลาดในการดึงข้อมูลห้อง:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการดึงข้อมูลห้อง" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { roomCode, roomType, roomCate } = body;

        console.log("ข้อมูลที่ได้รับ:", { roomCode, roomType, roomCate });

        if (!roomCode || !roomType) {
            return NextResponse.json(
                { error: "roomCode และ roomType เป็นข้อมูลที่จำเป็น" },
                { status: 400 }
            );
        }

        const room = await prisma.room_tb.create({
            data: {
                roomCode: roomCode.trim(),
                roomType: roomType.trim(),
                roomCate: roomCate || null,
            },
        });

        console.log("สร้างห้อง:", room);

        return NextResponse.json(room, { status: 201 });
    } catch (error) {
        console.error("ผิดพลาดในการสร้างห้อง:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการสร้างห้อง" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}