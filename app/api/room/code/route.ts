import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const roomCode = url.searchParams.get('roomCode');

        if (!roomCode) {
            return NextResponse.json({ error: "ต้องระบุรหัสห้อง" }, { status: 400 });
        }

        const room = await prisma.room_tb.findFirst({
            where: { roomCode: roomCode }
        });

        if (!room) {
            return NextResponse.json(null, { status: 200 });
        }

        return NextResponse.json(room, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}