import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const yearLevels = [
        { name: 'ปี 1' },
        { name: 'ปี 2' },
        { name: 'ปี 3' },
        { name: 'ปี 4' },
    ]

    for (const yl of yearLevels) {
        const existing = await prisma.yearLevel_tb.findFirst({ where: { name: yl.name } });
        if (existing) {
            await prisma.yearLevel_tb.update({
                where: { id: existing.id },
                data: {}
            });
        } else {
            await prisma.yearLevel_tb.create({
                data: yl
            });
        }
    }
    console.log('การใส่ข้อมูลเริ่มต้นใน YearLevel_tb เสร็จแล้ว')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })