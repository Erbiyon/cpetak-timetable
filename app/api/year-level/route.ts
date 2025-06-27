import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    const yearLevels = await prisma.yearLevel_tb.findMany({
        orderBy: { name: "asc" }
    })
    return NextResponse.json(yearLevels)
}