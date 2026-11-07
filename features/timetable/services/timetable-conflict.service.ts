import { prisma } from "@/lib/prisma";
import { ConflictItem, TimetableConflictCheckOptions } from "../types";

export class TimetableConflictService {
  /**
   * Evaluates scheduling conflicts for an assignment.
   * Checks Time, Teacher, Room, and Duplicate Section conflicts.
   */
  static async checkConflicts(
    options: TimetableConflictCheckOptions,
    prismaClient: any = prisma,
  ): Promise<ConflictItem[]> {
    const {
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
    } = options;

    const conflicts: ConflictItem[] = [];

    // 1. Time Conflict in same termYear, yearLevel, planType, and day
    const timeConflicts = await prismaClient.timetable_tb.findMany({
      where: {
        termYear,
        yearLevel,
        planType,
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
        NOT: {
          planId: planId,
        },
      },
      include: {
        plan: true,
        teacher: true,
        room: true,
      },
    });

    if (timeConflicts.length > 0) {
      conflicts.push({
        type: "TIME_CONFLICT",
        message: "พบการซ้ำของเวลาเรียน",
        conflicts: timeConflicts.map((tc: any) => ({
          planId: tc.planId,
          plan: tc.plan,
          day: tc.day,
          startPeriod: tc.startPeriod,
          endPeriod: tc.endPeriod,
          teacher: tc.teacher,
          room: tc.room,
          section: tc.section,
        })),
      });
    }

    // 2. Teacher Conflict
    if (teacherId) {
      const teacherConflicts = await prismaClient.timetable_tb.findMany({
        where: {
          teacherId,
          termYear,
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
          NOT: {
            planId: planId,
          },
        },
        include: {
          plan: true,
          teacher: true,
          room: true,
        },
      });

      if (teacherConflicts.length > 0) {
        conflicts.push({
          type: "TEACHER_CONFLICT",
          message: "อาจารย์มีการสอนในเวลาดังกล่าวแล้ว",
          conflicts: teacherConflicts.map((tc: any) => ({
            planId: tc.planId,
            plan: tc.plan,
            day: tc.day,
            startPeriod: tc.startPeriod,
            endPeriod: tc.endPeriod,
            teacher: tc.teacher,
            room: tc.room,
            section: tc.section,
          })),
        });
      }
    }

    // 3. Room Conflict
    if (roomId) {
      const roomConflicts = await prismaClient.timetable_tb.findMany({
        where: {
          roomId,
          termYear,
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
          NOT: {
            planId: planId,
          },
        },
        include: {
          plan: true,
          teacher: true,
          room: true,
        },
      });

      if (roomConflicts.length > 0) {
        conflicts.push({
          type: "ROOM_CONFLICT",
          message: "ห้องเรียนถูกใช้งานในเวลาดังกล่าวแล้ว",
          conflicts: roomConflicts.map((tc: any) => ({
            planId: tc.planId,
            plan: tc.plan,
            day: tc.day,
            startPeriod: tc.startPeriod,
            endPeriod: tc.endPeriod,
            teacher: tc.teacher,
            room: tc.room,
            section: tc.section,
          })),
        });
      }
    }

    // 4. Duplicate Section Conflict across different curricula
    if (section) {
      const currentPlan = await prismaClient.plans_tb.findUnique({
        where: { id: planId },
      });

      if (currentPlan) {
        const currentIsDVE =
          currentPlan.planType === "DVE-MSIX" ||
          currentPlan.planType === "DVE-LVC";

        const duplicateSectionPlans = await prismaClient.plans_tb.findMany({
          where: {
            subjectCode: currentPlan.subjectCode,
            termYear: currentPlan.termYear,
            section: section,
            planType: {
              not: currentPlan.planType,
            },
            NOT: {
              id: planId,
            },
          },
          include: {
            timetables: true,
          },
        });

        const filteredDuplicates = currentIsDVE
          ? duplicateSectionPlans.filter(
              (plan: any) =>
                plan.planType !== "DVE-MSIX" && plan.planType !== "DVE-LVC",
            )
          : duplicateSectionPlans;

        if (filteredDuplicates.length > 0) {
          const conflictDetails = filteredDuplicates
            .map((plan: any) => {
              const planTypeText =
                plan.planType === "TRANSFER"
                  ? "เทียบโอน"
                  : plan.planType === "FOUR_YEAR"
                    ? "4 ปี"
                    : plan.planType === "DVE-MSIX"
                      ? "DVE-MSIX"
                      : plan.planType === "DVE-LVC"
                        ? "DVE-LVC"
                        : plan.planType;
              return `${planTypeText} ${plan.yearLevel}`;
            })
            .join(", ");

          conflicts.push({
            type: "DUPLICATE_SECTION_CONFLICT",
            message: `วิชา ${currentPlan.subjectCode} กลุ่มเรียน ${section} มีอยู่แล้วในแผนการเรียน: ${conflictDetails}`,
            conflicts: filteredDuplicates.map((plan: any) => ({
              planId: plan.id,
              subjectCode: plan.subjectCode,
              planType: plan.planType,
              yearLevel: plan.yearLevel,
              section: plan.section,
              termYear: plan.termYear,
            })),
          });
        }
      }
    }

    return conflicts;
  }
}
