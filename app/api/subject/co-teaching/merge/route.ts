import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: Request) {
    const { groupKey, planIds } = await req.json();

    // ค้นหาหรือสร้าง groupKey
    let group = await prisma.coTeaching_tb.findUnique({ where: { groupKey } });
    if (!group) {
        group = await prisma.coTeaching_tb.create({
            data: {
                groupKey,
                plans: { connect: planIds.map((id: number) => ({ id })) }
            }
        });
    } else {
        await prisma.coTeaching_tb.update({
            where: { id: group.id },
            data: { plans: { connect: planIds.map((id: number) => ({ id })) } }
        });
    }
    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
    const { groupKey, planIds } = await req.json();

    // หา group
    const group = await prisma.coTeaching_tb.findUnique({ where: { groupKey }, include: { plans: true } });
    if (!group) return NextResponse.json({ success: true });

    // ตัดความสัมพันธ์ planIds ออกจาก group
    await prisma.coTeaching_tb.update({
        where: { id: group.id },
        data: { plans: { disconnect: planIds.map((id: number) => ({ id })) } }
    });

    // ถ้าไม่เหลือ plan ใน group ให้ลบ groupKey ทิ้ง
    const updated = await prisma.coTeaching_tb.findUnique({ where: { id: group.id }, include: { plans: true } });
    if (updated && updated.plans.length === 0) {
        await prisma.coTeaching_tb.delete({ where: { id: group.id } });
    }

    return NextResponse.json({ success: true });
}