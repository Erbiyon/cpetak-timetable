import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const subjectId = parseInt(params.id);
        const { teacherId } = await request.json();

        console.log('Updating subject teacher:', { subjectId, teacherId });

        if (isNaN(subjectId)) {
            return NextResponse.json({ error: 'Invalid subject ID' }, { status: 400 });
        }

        // อัปเดตอาจารย์ผู้สอน
        const updatedSubject = await prisma.plans_tb.update({
            where: { id: subjectId },
            data: { teacherId: teacherId },
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
                        tName: true,        // แก้ตรงนี้
                        tLastName: true,    // เพิ่ม lastName
                        tId: true           // แก้ตรงนี้
                    }
                }
            }
        });

        console.log('Updated subject:', updatedSubject);
        return NextResponse.json(updatedSubject);
    } catch (error) {
        console.error('Error updating subject teacher:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}