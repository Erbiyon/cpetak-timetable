import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const subjectId = parseInt(id);
        const { roomId } = await request.json();

        console.log('กำลังอัปเดตห้องเรียนของวิชา:', { subjectId, roomId });

        if (isNaN(subjectId)) {
            return NextResponse.json({ error: 'ID วิชาไม่ถูกต้อง' }, { status: 400 });
        }


        const updatedSubject = await prisma.plans_tb.update({
            where: { id: subjectId },
            data: { roomId: roomId },
            include: {
                room: {
                    select: {
                        id: true,
                        roomCode: true,
                        roomType: true
                    }
                },
                teacher: {
                    select: {
                        id: true,
                        tName: true,
                        tLastName: true,
                        tId: true
                    }
                }
            }
        });

        console.log('ห้องเรียนของวิชาได้รับการอัปเดตแล้ว:', updatedSubject);
        return NextResponse.json(updatedSubject);
    } catch (error) {
        console.error('ผิดพลาดในการอัปเดตห้องเรียนของวิชา:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
    }
}