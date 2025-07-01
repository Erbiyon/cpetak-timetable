import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    const rooms = await prisma.room_tb.findMany({ orderBy: { roomCode: "asc" } })
    return NextResponse.json(rooms)
}

export async function POST(req: NextRequest) {
    const { roomCode, roomType } = await req.json()
    const createRoom = await prisma.room_tb.create({
        data: { roomCode, roomType }
    })
    return NextResponse.json(createRoom)
}