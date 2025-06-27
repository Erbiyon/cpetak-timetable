import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient, PlanType } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    const { code, name, credit, lecture, practice, termId, planType, academicYear, yearLevelId } = req.body

    if (!code || !name || !credit || !lecture || !practice || !termId || !planType || !academicYear || !yearLevelId) {
        return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' })
    }

    try {
        const plan = await prisma.plans_tb.create({
            data: {
                subjectCode: code,
                subjectName: name,
                credit: Number(credit),
                lectureHour: Number(lecture),
                labHour: Number(practice),
                termId: Number(termId),
                planType: planType as PlanType,
                academicYear: Number(academicYear),
                yearLevelId: Number(yearLevelId),
            },
        })
        return res.status(201).json({ message: 'เพิ่มวิชาเรียบร้อย', data: plan })
    } catch (error) {
        return res.status(500).json({ message: 'เกิดข้อผิดพลาด', error })
    }
}