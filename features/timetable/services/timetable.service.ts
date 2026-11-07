import { prisma } from "@/lib/prisma";
import { CreateTimetableInput, CreateTimetableResult } from "../types";
import { TimetableConflictService } from "./timetable-conflict.service";
import { TimetableLockService } from "./timetable-lock.service";
import { withTimetableRetry } from "../utils/timetable-retry";

export class TimetableService {
  /**
   * Creates a timetable assignment with conflict verification,
   * single/multi assignment rules, Term 3 exceptions, DVE cross-curriculum synchronization,
   * and Co-Teaching assignment mirroring within an atomic transaction.
   *
   * Enforces fine-grained InnoDB row-level locking on TimetableLock_tb
   * before re-validating conflicts inside the transaction to eliminate TOCTOU race conditions.
   * Wrapped in withTimetableRetry to absorb transient MySQL gap-lock conflicts gracefully.
   */
  static async createTimetable(input: CreateTimetableInput): Promise<CreateTimetableResult> {
    return withTimetableRetry(async () => {
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
    const isTerm3 = typeof termYear === "string" && termYear.startsWith("3/");

    // Collect additional plan IDs affected (e.g. Co-Teaching or DVE counterparts)
    const additionalPlanIds: number[] = [];
    if (isCoTeaching && coTeachingGroup) {
      for (const p of coTeachingGroup.plans) {
        if (p.id !== planId) additionalPlanIds.push(p.id);
      }
    }

    const lockKeys = TimetableLockService.buildAssignmentLockKeys({
      planId,
      termYear,
      yearLevel,
      planType,
      day,
      roomId,
      teacherId,
      additionalPlanIds,
    });

    return prisma.$transaction(
      async (tx) => {
        // 1. Acquire exclusive locks in deterministic order
        await TimetableLockService.acquireLocks(tx, lockKeys);

        // 2. Re-validate conflict rules under exclusive lock
        if (shouldCheckConflicts) {
          const conflicts = await TimetableConflictService.checkConflicts(
            {
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
            },
            tx,
          );

          if (conflicts.length > 0) {
            return {
              success: false,
              conflicts,
              statusCode: 409,
            };
          }
        }

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
    }, { maxWait: 10000, timeout: 10000 });
    });
  }

  /**
   * Deletes all timetable entries associated with a planId,
   * handling DVE cross-curriculum synchronization and Co-Teaching group plans atomically.
   */
  static async deleteTimetable(input: {
    planId: number;
    planRecord?: any;
  }): Promise<import("../types").DeleteTimetableResult> {
    const { planId, planRecord } = input;

    const currentPlan =
      planRecord !== undefined
        ? planRecord
        : await prisma.plans_tb.findUnique({
            where: { id: planId },
          });

    if (!currentPlan) {
      return {
        success: false,
        statusCode: 404,
        error: "Plan not found",
      };
    }

    const isDVE =
      currentPlan.planType === "DVE-MSIX" || currentPlan.planType === "DVE-LVC";
    const isTransferOrFourYear =
      currentPlan.planType === "TRANSFER" ||
      currentPlan.planType === "FOUR_YEAR";

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
              timetables: true,
              teacher: true,
              room: true,
            },
          },
        },
      });
      isCoTeaching =
        coTeachingGroup !== null && coTeachingGroup.plans.length > 1;
    }

    // Build lock keys for all affected plans and their resources
    const allAffectedPlanIds = [planId];
    if (isCoTeaching && coTeachingGroup) {
      for (const p of coTeachingGroup.plans) {
        if (!allAffectedPlanIds.includes(p.id)) allAffectedPlanIds.push(p.id);
      }
    }

    const deleteLockKeys = TimetableLockService.buildAssignmentLockKeys({
      planId,
      termYear: currentPlan.termYear || undefined,
      yearLevel: currentPlan.yearLevel || undefined,
      planType: currentPlan.planType || undefined,
      roomId: currentPlan.roomId,
      teacherId: currentPlan.teacherId,
      additionalPlanIds: allAffectedPlanIds,
    });

    return prisma.$transaction(
      async (tx) => {
        await TimetableLockService.acquireLocks(tx, deleteLockKeys);
        let deletedPlans: number[] = [];

      if (isDVE) {
        const isSplitSubject =
          currentPlan.subjectName && currentPlan.subjectName.includes("(ส่วนที่");

        if (isSplitSubject) {
          const duplicatePlans = await tx.plans_tb.findMany({
            where: {
              subjectCode: currentPlan.subjectCode,
              subjectName: currentPlan.subjectName,
              termYear: currentPlan.termYear,
              yearLevel: currentPlan.yearLevel,
              NOT: {
                id: planId,
              },
            },
          });

          const allPlanIds = [planId, ...duplicatePlans.map((p) => p.id)];

          const deleteResult = await tx.timetable_tb.deleteMany({
            where: {
              planId: {
                in: allPlanIds,
              },
            },
          });

          deletedPlans = allPlanIds;

          return {
            success: true,
            statusCode: 200,
            message: "ลบตารางเรียนสำหรับวิชาที่แบ่งแล้วพร้อม sync",
            deletedPlans,
            deletedCount: deleteResult.count,
          };
        } else {
          const duplicatePlans = await tx.plans_tb.findMany({
            where: {
              subjectCode: currentPlan.subjectCode,
              termYear: currentPlan.termYear,
              yearLevel: currentPlan.yearLevel,
              NOT: {
                id: planId,
              },
            },
          });

          const allPlanIds = [planId, ...duplicatePlans.map((p) => p.id)];

          const deleteResult = await tx.timetable_tb.deleteMany({
            where: {
              planId: {
                in: allPlanIds,
              },
            },
          });

          deletedPlans = allPlanIds;

          return {
            success: true,
            statusCode: 200,
            message: "ลบตารางเรียนสำหรับวิชา DVE ที่มีรหัสเหมือนกันทั้งหมดแล้ว",
            deletedPlans,
            deletedCount: deleteResult.count,
          };
        }
      } else if (isCoTeaching && isTransferOrFourYear && coTeachingGroup) {
        const planIds = coTeachingGroup.plans.map((p) => p.id);

        const deleteResult = await tx.timetable_tb.deleteMany({
          where: {
            planId: {
              in: planIds,
            },
          },
        });

        deletedPlans = planIds;

        return {
          success: true,
          statusCode: 200,
          message: "ลบตารางเรียนสำหรับวิชาที่สอนร่วมทั้งหมดแล้ว",
          deletedPlans,
          deletedCount: deleteResult.count,
        };
      } else {
        const deleteResult = await tx.timetable_tb.deleteMany({
          where: { planId },
        });

        deletedPlans = [planId];

        return {
          success: true,
          statusCode: 200,
          message: "ลบตารางเรียนแล้ว",
          deletedPlans,
          deletedCount: deleteResult.count,
        };
      }
    }, { maxWait: 10000, timeout: 10000 });
  }

  /**
   * Deletes a specific single timetable record by recordId,
   * handling DVE Term 3 synchronization across counterpart plans atomically.
   */
  static async deleteTimetableRecord(input: {
    recordId: number;
  }): Promise<import("../types").DeleteTimetableRecordResult> {
    const { recordId } = input;

    const record = await prisma.timetable_tb.findUnique({
      where: { id: recordId },
      include: { plan: true },
    });

    if (!record) {
      return {
        success: false,
        statusCode: 404,
        error: "Record not found",
      };
    }

    const recordLockKeys = TimetableLockService.buildAssignmentLockKeys({
      planId: record.planId,
      termYear: record.termYear,
      yearLevel: record.yearLevel,
      planType: record.planType,
      day: record.day,
      roomId: record.roomId,
      teacherId: record.teacherId,
    });

    return prisma.$transaction(
      async (tx) => {
        await TimetableLockService.acquireLocks(tx, recordLockKeys);
        await tx.timetable_tb.delete({ where: { id: recordId } });

      // DVE Term 3: sync delete matching record in counterpart curriculum (LVC <-> MSIX)
      const isDVE =
        record.planType === "DVE-LVC" || record.planType === "DVE-MSIX";
      const isTerm3 =
        typeof record.termYear === "string" && record.termYear.startsWith("3/");

      if (isDVE && isTerm3 && record.plan) {
        const isSplitSubject = record.plan.subjectName?.includes("(ส่วนที่");
        const duplicatePlans = await tx.plans_tb.findMany({
          where: isSplitSubject
            ? {
                subjectCode: record.plan.subjectCode,
                subjectName: record.plan.subjectName,
                termYear: record.plan.termYear,
                yearLevel: record.plan.yearLevel,
                NOT: { id: record.planId },
              }
            : {
                subjectCode: record.plan.subjectCode,
                termYear: record.plan.termYear,
                yearLevel: record.plan.yearLevel,
                NOT: { id: record.planId },
              },
        });

        for (const dup of duplicatePlans) {
          await tx.timetable_tb.deleteMany({
            where: {
              planId: dup.id,
              day: record.day,
              startPeriod: record.startPeriod,
              endPeriod: record.endPeriod,
            },
          });
        }
      }

      return {
        success: true,
        statusCode: 200,
        deletedId: recordId,
        planId: record.planId,
      };
    }, { maxWait: 10000, timeout: 10000 });
  }

  /**
   * Clears timetable records within a strictly bounded scope: termYear, yearLevel, and planType.
   */
  static async clearTimetable(
    input: import("../types").ClearTimetableInput,
  ): Promise<import("../types").ClearTimetableResult> {
    const { termYear, yearLevel, planType } = input;

    if (!termYear || !yearLevel || !planType) {
      return {
        success: false,
        statusCode: 400,
        error: "Missing required parameters",
      };
    }

    const scopeLockKeys = TimetableLockService.buildScopeLockKeys(
      termYear,
      yearLevel,
      planType,
    );

    return prisma.$transaction(
      async (tx) => {
        await TimetableLockService.acquireLocks(tx, scopeLockKeys);

        const deleteResult = await tx.timetable_tb.deleteMany({
          where: {
            termYear,
            yearLevel,
            planType,
          },
        });

        return {
          success: true,
          statusCode: 200,
          message: "All subjects cleared from timetable",
          deletedCount: deleteResult.count,
        };
      },
      { maxWait: 10000, timeout: 10000 },
    );
  }

  /**
   * Retrieves timetable records based on query filters (roomId, teacherId, or curriculum coordinates).
   */
  static async getTimetables(query: import("../types").GetTimetableQuery) {
    const { roomId, teacherId, termYear, yearLevel, planType } = query;

    if (roomId !== undefined) {
      const whereClause: any = { roomId };
      if (termYear) whereClause.termYear = termYear;

      return prisma.timetable_tb.findMany({
        where: whereClause,
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
        orderBy: [{ day: "asc" }, { startPeriod: "asc" }],
      });
    }

    if (teacherId !== undefined) {
      const whereClause: any = { teacherId };
      if (termYear) whereClause.termYear = termYear;

      return prisma.timetable_tb.findMany({
        where: whereClause,
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
        orderBy: [{ day: "asc" }, { startPeriod: "asc" }],
      });
    }

    const whereClause: any = {};
    if (termYear) whereClause.termYear = termYear;
    if (yearLevel) whereClause.yearLevel = yearLevel;
    if (planType) whereClause.planType = planType;

    return prisma.timetable_tb.findMany({
      where: whereClause,
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
      orderBy: [{ day: "asc" }, { startPeriod: "asc" }],
    });
  }
}
