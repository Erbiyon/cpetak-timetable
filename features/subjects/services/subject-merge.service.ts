import { prisma } from "@/lib/prisma";
import { checkCoTeachingGroup, handleCoTeachingMerge } from "@/utils/co-teaching-helper";

export class SubjectMergeService {
  /**
   * Merges multiple split parts back into one primary subject plan within a transaction.
   */
  static async mergeSubjectParts(splitParts: any[], baseSubjectName: string, prismaClient: any = prisma) {
    const totalLectureHours = splitParts.reduce(
      (sum, part) => sum + (part.lectureHour || 0),
      0,
    );
    const totalLabHours = splitParts.reduce(
      (sum, part) => sum + (part.labHour || 0),
      0,
    );

    let originalSection: string | null = null;
    for (const part of splitParts) {
      if (part.section) {
        const sectionMatch = part.section.match(/^(.+)-\d+$/);
        if (sectionMatch) {
          originalSection = sectionMatch[1];
          break;
        } else {
          originalSection = part.section;
          break;
        }
      }
    }

    let mergedRoomId = null;
    let mergedTeacherId = null;

    for (const part of splitParts) {
      if (!mergedRoomId && part.roomId) mergedRoomId = part.roomId;
      if (!mergedTeacherId && part.teacherId) mergedTeacherId = part.teacherId;
    }

    await prismaClient.timetable_tb.deleteMany({
      where: {
        planId: {
          in: splitParts.map((part) => part.id),
        },
      },
    });

    const mergedSubject = await prismaClient.plans_tb.update({
      where: { id: splitParts[0].id },
      data: {
        subjectName: baseSubjectName,
        lectureHour: totalLectureHours,
        labHour: totalLabHours,
        roomId: mergedRoomId,
        teacherId: mergedTeacherId,
        section: originalSection,
      },
      include: {
        room: true,
        teacher: true,
      },
    });

    const partsToDelete = splitParts.slice(1).map((part) => part.id);
    if (partsToDelete.length > 0) {
      await prismaClient.plans_tb.deleteMany({
        where: {
          id: {
            in: partsToDelete,
          },
        },
      });
    }

    return mergedSubject;
  }

  /**
   * Merges subject parts and collects list of deleted IDs.
   */
  static async mergeSubjectPartsWithDeleted(
    splitParts: any[],
    baseSubjectName: string,
    prismaClient: any = prisma,
  ) {
    const mergedSubject = await this.mergeSubjectParts(splitParts, baseSubjectName, prismaClient);
    const deletedParts = splitParts.slice(1).map((part) => part.id);

    return {
      mergedSubject,
      deletedParts,
    };
  }

  /**
   * Coordinates subject merge workflow for single, DVE, or Co-Teaching groups.
   * Guarantees atomic execution via prisma.$transaction.
   */
  static async mergeSubject(subjectId: number) {
    return prisma.$transaction(async (tx) => {
      const subjectToMerge = await tx.plans_tb.findUnique({
        where: { id: subjectId },
        include: {
          room: true,
          teacher: true,
        },
      });

      if (!subjectToMerge) {
        return { success: false, error: "ไม่พบวิชาที่ระบุ", statusCode: 404 };
      }

      const baseSubjectName = subjectToMerge.subjectName.replace(
        /\s*\(ส่วนที่ \d+\)\s*$/,
        "",
      );
      const subjectCode = subjectToMerge.subjectCode;

      const coTeachingGroup = await checkCoTeachingGroup(subjectId);

      if (coTeachingGroup) {
        const relatedCoTeachingGroups = await tx.coTeaching_tb.findMany({
          where: {
            OR: [
              {
                groupKey: {
                  startsWith: `${subjectCode}-`,
                },
              },
              {
                plans: {
                  some: {
                    subjectCode: subjectCode,
                    termYear: subjectToMerge.termYear,
                  },
                },
              },
            ],
          },
          include: {
            plans: {
              where: {
                subjectCode: subjectCode,
                termYear: subjectToMerge.termYear,
                planType: {
                  in: ["TRANSFER", "FOUR_YEAR"],
                },
              },
            },
          },
        });

        const allPlansToMerge = relatedCoTeachingGroups.flatMap(
          (group) => group.plans,
        );

        if (allPlansToMerge.length === 0) {
          return { success: false, error: "ไม่พบวิชาที่สามารถรวมได้", statusCode: 400 };
        }

        const groupedByPlanTypeAndYear = allPlansToMerge.reduce(
          (acc, plan) => {
            const key = `${plan.planType}-${plan.yearLevel}`;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(plan);
            return acc;
          },
          {} as Record<string, any[]>,
        );

        const mergedSubjects: any[] = [];
        let allDeletedParts: number[] = [];

        for (const [, plans] of Object.entries(groupedByPlanTypeAndYear)) {
          if (plans.length > 0) {
            const result = await this.mergeSubjectPartsWithDeleted(
              plans,
              baseSubjectName,
              tx,
            );
            mergedSubjects.push(result.mergedSubject);
            allDeletedParts = allDeletedParts.concat(result.deletedParts);
          }
        }

        await handleCoTeachingMerge(
          subjectCode,
          subjectToMerge.termYear || "",
          mergedSubjects.map((s) => s.id),
        );

        return {
          success: true,
          statusCode: 200,
          mergedSubjects,
          mergedSubject: mergedSubjects[0],
          deletedParts: allDeletedParts,
          isCoTeaching: true,
        };
      } else {
        const allParts = await tx.plans_tb.findMany({
          where: {
            subjectCode: subjectCode,
            subjectName: {
              contains: baseSubjectName,
            },
            termYear: subjectToMerge.termYear,
            yearLevel: subjectToMerge.yearLevel,
            planType: subjectToMerge.planType,
          },
          include: {
            room: true,
            teacher: true,
          },
        });

        const splitParts = allParts.filter((part) =>
          part.subjectName.includes("(ส่วนที่"),
        );

        if (splitParts.length < 2) {
          return { success: false, error: "ไม่พบส่วนที่แบ่งเพื่อรวม", statusCode: 400 };
        }

        const result = await this.mergeSubjectPartsWithDeleted(
          splitParts,
          baseSubjectName,
          tx,
        );

        return {
          success: true,
          statusCode: 200,
          mergedSubject: result.mergedSubject,
          deletedParts: result.deletedParts,
          isCoTeaching: false,
        };
      }
    });
  }
}
