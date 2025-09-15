import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const termYear = searchParams.get('termYear');

        console.log('กำลังดึงรายวิชาของภาควิชาสำหรับปีการศึกษา:', termYear);

        const subjects = await prisma.plans_tb.findMany({
            where: {
                ...(termYear && { termYear: termYear }),
                dep: "ในสาขา"
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
                        tName: true,
                        tLastName: true,
                        tId: true
                    }
                }
            },
            orderBy: [
                { planType: 'asc' },
                { yearLevel: 'asc' },
                { subjectCode: 'asc' }
            ]
        });

        console.log('จำนวนวิชาที่เจอ:', subjects.length);
        return NextResponse.json(subjects);
    } catch (error) {
        console.error('ผิดพลาดในการดึงข้อมูลวิชาในสาขา:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
    }
}