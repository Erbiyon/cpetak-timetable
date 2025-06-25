import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const FIXED_TERMS = [
    { name: "ภาคเรียนที่ 1" },
    { name: "ภาคเรียนที่ 2" },
    { name: "ภาคเรียนที่ 3" },
]

export async function POST(req: NextRequest) {
    const { name, start, end } = await req.json()

    const allTerms = await prisma.term_tb.findMany()
    const found = allTerms.find(t => t.name === name)

    if (!found && allTerms.length < 3) {
        if (FIXED_TERMS.some(t => t.name === name)) {
            const created = await prisma.term_tb.create({
                data: { name, start, end }
            })
            return NextResponse.json(created)
        } else {
            return NextResponse.json({ error: "Invalid term name" }, { status: 400 })
        }
    } else if (found) {
        const updated = await prisma.term_tb.update({
            where: { id: found.id },
            data: { start, end }
        })
        return NextResponse.json(updated)
    } else {
        return NextResponse.json({ error: "Term limit reached" }, { status: 400 })
    }
}

export async function GET() {
    const terms = await prisma.term_tb.findMany({
        orderBy: { name: "asc" }
    })
    return NextResponse.json(terms)
}