import { NextRequest, NextResponse } from "next/server"
import { createTerm } from "@/prisma-db/prisma-db"

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { name, start, end } = body
    if (!name || !start || !end) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    try {
        const term = await createTerm({
            name,
            start: new Date(start),
            end: new Date(end),
        })
        return NextResponse.json(term)
    } catch (error) {
        return NextResponse.json({ error: "Failed to create term" }, { status: 500 })
    }
}