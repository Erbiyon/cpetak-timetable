import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const planId = parseInt(id);

        const timetable = await prisma.timetable_tb.findMany({
            where: { planId },
            include: {
                plan: {
                    include: {
                        teacher: true,
                        room: true
                    }
                },
                teacher: true,
                room: true
            }
        });

        return Response.json(timetable);

    } catch (error) {
        console.error("Error fetching timetable:", error);
        return Response.json(
            { error: "เกิดข้อผิดพลาดในการดึงข้อมูลตารางเรียน" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const planId = parseInt(id);

        if (isNaN(planId)) {
            return Response.json(
                { error: "Invalid plan ID" },
                { status: 400 }
            );
        }

        console.log("Attempting to delete timetable for planId:", planId);

        // ดึงข้อมูลวิชาปัจจุบัน
        const currentPlan = await prisma.plans_tb.findUnique({
            where: { id: planId }
        });

        if (!currentPlan) {
            return Response.json(
                { error: "Plan not found" },
                { status: 404 }
            );
        }

        const isDVE = currentPlan.planType === 'DVE-MSIX' || currentPlan.planType === 'DVE-LVC';
        const isTransferOrFourYear = currentPlan.planType === 'TRANSFER' || currentPlan.planType === 'FOUR_YEAR';

        // ตรวจสอบ Co-Teaching (เฉพาะ Transfer และ Four Year)
        let coTeachingGroup = null;
        let isCoTeaching = false;

        if (isTransferOrFourYear) {
            coTeachingGroup = await prisma.coTeaching_tb.findFirst({
                where: {
                    plans: {
                        some: {
                            id: planId
                        }
                    }
                },
                include: {
                    plans: {
                        include: {
                            timetables: true,
                            teacher: true,
                            room: true
                        }
                    }
                }
            });
            // แก้ไขการกำหนดค่า isCoTeaching
            isCoTeaching = coTeachingGroup !== null && coTeachingGroup.plans.length > 1;
        }

        console.log("Delete analysis:", {
            planId,
            isDVE,
            isTransferOrFourYear,
            isCoTeaching,
            planType: currentPlan.planType
        });

        let deletedPlans: number[] = [];

        if (isDVE) {
            // DVE: ลบทุกวิชาที่มีรหัสเหมือนกันในภาคเรียนเดียวกัน
            const duplicatePlans = await prisma.plans_tb.findMany({
                where: {
                    subjectCode: currentPlan.subjectCode,
                    termYear: currentPlan.termYear,
                    NOT: {
                        id: planId
                    }
                }
            });

            const allPlanIds = [planId, ...duplicatePlans.map(p => p.id)];

            console.log("DVE: Deleting timetables for duplicate plans:", allPlanIds);

            const deleteResult = await prisma.timetable_tb.deleteMany({
                where: {
                    planId: {
                        in: allPlanIds
                    }
                }
            });

            deletedPlans = allPlanIds;

            return Response.json({
                message: "ลบตารางเรียนสำหรับวิชา DVE ที่มีรหัสเหมือนกันทั้งหมดแล้ว",
                deletedPlans: deletedPlans,
                deletedCount: deleteResult.count
            });

        } else if (isCoTeaching && isTransferOrFourYear && coTeachingGroup) {
            // Transfer/Four Year Co-Teaching: ลบทุกวิชาใน Co-Teaching group
            const planIds = coTeachingGroup.plans.map(p => p.id);

            console.log("Co-Teaching: Deleting timetables for group:", planIds);

            const deleteResult = await prisma.timetable_tb.deleteMany({
                where: {
                    planId: {
                        in: planIds
                    }
                }
            });

            deletedPlans = planIds;

            return Response.json({
                message: "ลบตารางเรียนสำหรับวิชาที่สอนร่วมทั้งหมดแล้ว",
                deletedPlans: deletedPlans,
                deletedCount: deleteResult.count
            });

        } else {
            // ปกติ: ลบเฉพาะวิชาที่เลือก
            console.log("Normal: Deleting timetable for single plan:", planId);

            const deleteResult = await prisma.timetable_tb.deleteMany({
                where: { planId }
            });

            deletedPlans = [planId];

            return Response.json({
                message: "ลบตารางเรียนแล้ว",
                deletedPlans: deletedPlans,
                deletedCount: deleteResult.count
            });
        }

    } catch (error) {
        console.error("Error deleting timetable:", error);
        return Response.json(
            {
                error: "เกิดข้อผิดพลาดในการลบตารางเรียน",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}