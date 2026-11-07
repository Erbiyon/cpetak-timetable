import { prisma } from "@/lib/prisma";
import { checkCoTeachingGroup, handleCoTeachingSplit } from "@/utils/co-teaching-helper";
import { SplitPartInput } from "../types";

export class SubjectSplitService {
  /**
   * Splits a single subject plan record into two distinct parts.
   */
  static async splitSingleSubject(
    originalSubject: any,
    splitData: { part1: SplitPartInput; part2: SplitPartInput },
    prismaClient: any = prisma,
  ) {
    const baseSubjectName = originalSubject.subjectName.replace(
      /\s*\(ส่วนที่ \d+\)\s*$/,
      "",
    );
    const originalSection = originalSubject.section || "1";
    const newSection1 = `${originalSection}-1`;
    const newSection2 = `${originalSection}-2`;

    const { part1, part2 } = splitData;

    await prismaClient.timetable_tb.deleteMany({
      where: { planId: originalSubject.id },
    });

    const updatedSubject = await prismaClient.plans_tb.update({
      where: { id: originalSubject.id },
      data: {
        subjectName: `${baseSubjectName} (ส่วนที่ ${part1.partNumber})`,
        lectureHour: part1.lectureHour,
        labHour: part1.labHour,
        roomId: originalSubject.roomId,
        teacherId: originalSubject.teacherId,
        section: newSection1,
      },
      include: {
        room: true,
        teacher: true,
      },
    });

    const newSubject = await prismaClient.plans_tb.create({
      data: {
        subjectCode: originalSubject.subjectCode,
        subjectName: `${baseSubjectName} (ส่วนที่ ${part2.partNumber})`,
        credit: originalSubject.credit,
        lectureHour: part2.lectureHour,
        labHour: part2.labHour,
        termYear: originalSubject.termYear,
        yearLevel: originalSubject.yearLevel,
        planType: originalSubject.planType,
        dep: originalSubject.dep,
        roomId: originalSubject.roomId,
        teacherId: originalSubject.teacherId,
        section: newSection2,
      },
      include: {
        room: true,
        teacher: true,
      },
    });

    return { updatedSubject, newSubject };
  }

  /**
   * Coordinates subject split workflow for single, DVE synchronized, or Co-Teaching subjects.
   */
  static async splitSubject(
    subjectId: number,
    splitData: { part1: SplitPartInput; part2: SplitPartInput },
  ) {
    const originalSubject = await prisma.plans_tb.findUnique({
      where: { id: subjectId },
      include: {
        room: true,
        teacher: true,
      },
    });

    if (!originalSubject) {
      return { success: false, error: "ไม่พบวิชาที่ระบุ", statusCode: 404 };
    }

    const coTeachingGroup = await checkCoTeachingGroup(subjectId);

    const allUpdatedSubjects: any[] = [];
    const allNewSubjects: any[] = [];

    if (coTeachingGroup) {
      const coTeachingSubjects = await prisma.plans_tb.findMany({
        where: {
          id: { in: coTeachingGroup.planIds },
        },
        include: {
          room: true,
          teacher: true,
        },
      });

      const part1Ids: number[] = [];
      const part2Ids: number[] = [];

      for (const subject of coTeachingSubjects) {
        const result = await this.splitSingleSubject(subject, splitData);
        allUpdatedSubjects.push(result.updatedSubject);
        allNewSubjects.push(result.newSubject);
        part1Ids.push(result.updatedSubject.id);
        part2Ids.push(result.newSubject.id);
      }

      await handleCoTeachingSplit(
        coTeachingGroup.groupKey,
        { part1Ids, part2Ids },
        originalSubject.subjectCode,
        originalSubject.termYear || "",
        {
          part1: splitData.part1.partNumber,
          part2: splitData.part2.partNumber,
        },
      );
    } else {
      const isDVEPlan =
        originalSubject.planType === "DVE-MSIX" ||
        originalSubject.planType === "DVE-LVC";

      if (isDVEPlan) {
        const sameSubjects = await prisma.plans_tb.findMany({
          where: {
            subjectCode: originalSubject.subjectCode,
            termYear: originalSubject.termYear,
            yearLevel: originalSubject.yearLevel,
            planType: {
              in: ["DVE-MSIX", "DVE-LVC"],
            },
          },
          include: {
            room: true,
            teacher: true,
          },
        });

        for (const subject of sameSubjects) {
          const result = await this.splitSingleSubject(subject, splitData);
          allUpdatedSubjects.push(result.updatedSubject);
          allNewSubjects.push(result.newSubject);
        }
      } else {
        const result = await this.splitSingleSubject(originalSubject, splitData);
        allUpdatedSubjects.push(result.updatedSubject);
        allNewSubjects.push(result.newSubject);
      }
    }

    return {
      success: true,
      statusCode: 200,
      updatedSubject: allUpdatedSubjects[0],
      newSubject: allNewSubjects[0],
      allUpdatedSubjects,
      allNewSubjects,
      isCoTeaching: !!coTeachingGroup,
    };
  }
}
