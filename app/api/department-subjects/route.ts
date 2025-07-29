import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const termYear = searchParams.get('termYear');

        console.log('Fetching department subjects for termYear:', termYear);

        // ดึงข้อมูลวิชาในสาขาทั้งหมด
        const subjects = await prisma.plans_tb.findMany({
            where: {
                ...(termYear && { termYear: termYear }),
                dep: "ในสาขา" // เฉพาะวิชาในสาขา
            },
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
                        tName: true,        // เปลี่ยนจาก teacherName เป็น tName
                        tLastName: true,    // เพิ่ม lastName
                        tId: true           // เปลี่ยนจาก teacherId เป็น tId
                    }
                }
            },
            orderBy: [
                { planType: 'asc' },
                { yearLevel: 'asc' },
                { subjectCode: 'asc' }
            ]
        });

        console.log('Found subjects:', subjects.length);
        return NextResponse.json(subjects);
    } catch (error) {
        console.error('Error fetching department subjects:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}