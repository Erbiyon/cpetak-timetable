import { prisma } from "@/lib/prisma";
import { CreateTimetableInput, CreateTimetableResult } from "../types";
import { TimetableConflictService } from "./timetable-conflict.service";

export class TimetableService {
  /**
   * Creates a timetable assignment with conflict verification,
   * single/multi assignment rules, Term 3 exceptions, DVE cross-curriculum synchronization,
   * and Co-Teaching assignment mirroring within an atomic transaction.
   */
  static async createTimetable(input: CreateTimetableInput): Promise<CreateTimetableResult> {
    const {
      planId,
      termYear,
      yearLevel,
      planType,
      day,
      startPeriod,
      endPeriod,
      roomId,
      teacherId,
      section,
    } = input;

    const isDVE = planType === "DVE-MSIX" || planType === "DVE-LVC";
    const isTransferOrFourYear =
      planType === "TRANSFER" || planType === "FOUR_YEAR";

    let coTeachingGroup = null;
    let isCoTeaching = false;

    if (isTransferOrFourYear) {
      coTeachingGroup = await prisma.coTeaching_tb.findFirst({
        where: {
          plans: {
            some: {
              id: planId,
            },
          },
        },
        include: {
          plans: {
            include: {
              teacher: true,
              room: true,
            },
          },
        },
      });

      isCoTeaching =
        coTeachingGroup !== null && coTeachingGroup.plans.length > 1;
    }

    const shouldCheckConflicts = !(isCoTeaching && isTransferOrFourYear);

    if (shouldCheckConflicts) {
      const conflicts = await TimetableConflictService.checkConflicts({
        planId,
        termYear,
        yearLevel,
        planType,
        day,
        startPeriod,
        endPeriod,
        teacherId,
        roomId,
        section,
      });

      if (conflicts.length > 0) {
        return {
          success: false,
          conflicts,
          statusCode: 409,
        };
      }
    }

    const isTerm3 = typeof termYear === "string" && termYear.startsWith("3/");

    return prisma.$transaction(async (tx) => {
      if (isTerm3) {
        const selfOverlap = await tx.timetable_tb.findFirst({
          where: {
            planId,
            day,
            OR: [
              {
                AND: [
                  { startPeriod: { lte: startPeriod } },
                  { endPeriod: { gte: startPeriod } },
                ],
              },
              {
                AND: [
                  { startPeriod: { lte: endPeriod } },
                  { endPeriod: { gte: endPeriod } },
                ],
              },
              {
                AND: [
                  { startPeriod: { gte: startPeriod } },
                  { endPeriod: { lte: endPeriod } },
                ],
              },
            ],
          },
        });
        if (selfOverlap) {
          return {
            success: false,
            error: "วิชานี้มีคาบซ้ำกันในวันเดียวกันแล้ว",
            statusCode: 409,
          };
        }
      } else {
        await tx.timetable_tb.deleteMany({
          where: { planId },
        });
      }

      const timetable = await tx.timetable_tb.create({
        data: {
          planId,
          termYear,
          yearLevel,
          planType,
          day,
          startPeriod,
          endPeriod,
          roomId: roomId || null,
          teacherId: teacherId || null,
          section: section || null,
        },
        include: {
          plan: {
            include: {
              teacher: true,
              room: true,
            },
          },
          teacher: true,
          room: true,
        },
      });

      // Synchronize DVE cross-curriculum pairs (DVE-MSIX <-> DVE-LVC)
      if (isDVE) {
        const currentPlan = await tx.plans_tb.findUnique({
          where: { id: planId },
        });

        if (currentPlan) {
          const isSplitSubject =
            currentPlan.subjectName &&
            currentPlan.subjectName.includes("(ส่วนที่");

          const duplicatePlans = await tx.plans_tb.findMany({
            where: {
              subjectCode: currentPlan.subjectCode,
              ...(isSplitSubject ? { subjectName: currentPlan.subjectName } : {}),
              termYear: currentPlan.termYear,
              yearLevel: currentPlan.yearLevel,
              NOT: {
                id: planId,
              },
            },
          });

          for (const duplicatePlan of duplicatePlans) {
            if (isTerm3) {
              await tx.timetable_tb.deleteMany({
                where: {
                  planId: duplicatePlan.id,
                  day,
                  OR: [
                    {
                      AND: [
                        { startPeriod: { lte: startPeriod } },
                        { endPeriod: { gte: startPeriod } },
                      ],
                    },
                    {
                      AND: [
                        { startPeriod: { lte: endPeriod } },
                        { endPeriod: { gte: endPeriod } },
                      ],
                    },
                    {
                      AND: [
                        { startPeriod: { gte: startPeriod } },
                        { endPeriod: { lte: endPeriod } },
                      ],
                    },
                  ],
                },
              });
            } else {
              await tx.timetable_tb.deleteMany({
                where: { planId: duplicatePlan.id },
              });
            }

            await tx.timetable_tb.create({
              data: {
                planId: duplicatePlan.id,
                termYear,
                yearLevel: duplicatePlan.yearLevel || yearLevel,
                planType: duplicatePlan.planType || planType,
                day,
                startPeriod,
                endPeriod,
                roomId: duplicatePlan.roomId || null,
                teacherId: duplicatePlan.teacherId || null,
                section: duplicatePlan.section || null,
              },
            });
          }
        }
      } else if (isCoTeaching && isTransferOrFourYear && coTeachingGroup) {
        // Synchronize Co-Teaching group plans
        const otherPlans = coTeachingGroup.plans.filter((p: any) => p.id !== planId);

        for (const otherPlan of otherPlans) {
          await tx.timetable_tb.deleteMany({
            where: { planId: otherPlan.id },
          });

          await tx.timetable_tb.create({
            data: {
              planId: otherPlan.id,
              termYear,
              yearLevel: otherPlan.yearLevel || yearLevel,
              planType: otherPlan.planType || planType,
              day,
              startPeriod,
              endPeriod,
              roomId: otherPlan.roomId || null,
              teacherId: otherPlan.teacherId || null,
              section: otherPlan.section || null,
            },
          });
        }
      }

      return {
        success: true,
        statusCode: 200,
        timetable,
      };
    });
  }
}
