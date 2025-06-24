import { PrismaClient, PlanType } from '@prisma/client'

const prisma = new PrismaClient();

export async function addSubject(
    subjectCode: string,
    subjectName: string,
    credit: number,
    lectureHour: number,
    labHour: number,
    termId: number,
    planType: PlanType,
    academicYear: number
) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    return prisma.plans_tb.create({
        data: {
            subjectCode,
            subjectName,
            credit,
            lectureHour,
            labHour,
            termId,
            planType,
            academicYear
        }
    });
}

export async function createTerm({
    name,
    start,
    end,
}: {
    name: string
    start: Date
    end: Date
}) {
    return await prisma.term_tb.create({
        data: {
            name,
            start,
            end,
        },
    })
}