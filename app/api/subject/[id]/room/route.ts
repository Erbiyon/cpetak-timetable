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

        console.log('Updating subject room:', { subjectId, roomId });

        if (isNaN(subjectId)) {
            return NextResponse.json({ error: 'Invalid subject ID' }, { status: 400 });
        }

        // อัปเดตห้องเรียน
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

        console.log('Updated subject room:', updatedSubject);
        return NextResponse.json(updatedSubject);
    } catch (error) {
        console.error('Error updating subject room:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}