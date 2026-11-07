import { prisma } from "@/lib/prisma";
import {
  CreateSubjectInput,
  PatchSubjectInput,
  SubjectFilterOptions,
  SubjectItem,
  UpdateSubjectInput,
} from "../types";

export class SubjectService {
  /**
   * Retrieves subject plans based on filtering criteria.
   */
  static async getSubjects(filters: SubjectFilterOptions = {}): Promise<SubjectItem[]> {
    const where: any = {};

    if (filters.termYear) {
      where.termYear = { contains: filters.termYear };
    }

    if (filters.yearLevel) {
      where.yearLevel = { contains: filters.yearLevel };
    }

    if (filters.planType) {
      where.planType = { contains: filters.planType };
    }

    if (filters.dep) {
      where.dep = { contains: filters.dep };
    }

    if (filters.subjectCode) {
      where.subjectCode = filters.subjectCode;
    }

    return prisma.plans_tb.findMany({
      where,
      include: {
        room: {
          select: {
            id: true,
            roomCode: true,
            roomType: true,
          },
        },
        teacher: {
          select: {
            id: true,
            tName: true,
            tLastName: true,
            tId: true,
          },
        },
      },
      orderBy: {
        subjectCode: "asc",
      },
    }) as unknown as SubjectItem[];
  }

  /**
   * Retrieves a single subject plan by its ID.
   */
  static async getSubjectById(id: number): Promise<SubjectItem | null> {
    return prisma.plans_tb.findUnique({
      where: { id },
      include: {
        room: true,
        teacher: true,
        timetables: true,
      },
    }) as unknown as SubjectItem | null;
  }

  /**
   * Creates a new subject study plan.
   */
  static async createSubject(data: CreateSubjectInput): Promise<SubjectItem> {
    return prisma.plans_tb.create({
      data: {
        subjectCode: data.subjectCode,
        subjectName: data.subjectName,
        credit: data.credit,
        lectureHour: data.lectureHour,
        labHour: data.labHour,
        yearLevel: data.yearLevel,
        planType: data.planType,
        termYear: data.termYear,
        dep: data.dep,
        roomId: data.roomId || null,
        teacherId: data.teacherId || null,
        section: data.section || null,
      },
      include: {
        room: {
          select: {
            id: true,
            roomCode: true,
          },
        },
        teacher: {
          select: {
            id: true,
            tName: true,
            tLastName: true,
            tId: true,
          },
        },
      },
    }) as unknown as SubjectItem;
  }

  /**
   * Updates a subject study plan by full payload.
   */
  static async updateSubject(id: number, data: Omit<UpdateSubjectInput, "id">): Promise<SubjectItem> {
    const updateData: any = {};

    if (data.subjectCode !== undefined) updateData.subjectCode = data.subjectCode;
    if (data.subjectName !== undefined) updateData.subjectName = data.subjectName;
    if (data.credit !== undefined) updateData.credit = data.credit;
    if (data.lectureHour !== undefined) updateData.lectureHour = data.lectureHour;
    if (data.labHour !== undefined) updateData.labHour = data.labHour;
    if (data.termYear !== undefined) updateData.termYear = data.termYear;
    if (data.yearLevel !== undefined) updateData.yearLevel = data.yearLevel;
    if (data.planType !== undefined) updateData.planType = data.planType;
    if (data.dep !== undefined) updateData.dep = data.dep;
    if (data.roomId !== undefined) updateData.roomId = data.roomId;
    if (data.teacherId !== undefined) updateData.teacherId = data.teacherId;
    if (data.section !== undefined) updateData.section = data.section;

    return prisma.plans_tb.update({
      where: { id },
      data: updateData,
      include: {
        room: {
          select: {
            id: true,
            roomCode: true,
          },
        },
        teacher: {
          select: {
            id: true,
            tName: true,
            tLastName: true,
            tId: true,
          },
        },
      },
    }) as unknown as SubjectItem;
  }

  /**
   * Patches a subject with Co-Teaching section propagation.
   */
  static async patchSubject(planId: number, body: PatchSubjectInput) {
    const { teacherId, roomId, sectionNumber, ...restData } = body;
    const updateData: any = { ...restData };

    if (teacherId !== undefined) {
      if (teacherId === null) {
        updateData.teacher = { disconnect: true };
      } else {
        updateData.teacher = { connect: { id: teacherId } };
      }
    }

    if (roomId !== undefined) {
      if (roomId === null) {
        updateData.room = { disconnect: true };
      } else {
        updateData.room = { connect: { id: roomId } };
      }
    }

    if (sectionNumber !== undefined) {
      updateData.section = sectionNumber ? sectionNumber.toString() : null;
    }

    const coTeachingGroup = await prisma.coTeaching_tb.findFirst({
      where: {
        plans: {
          some: {
            id: planId,
          },
        },
      },
      include: {
        plans: true,
      },
    });

    const isCoTeaching = coTeachingGroup && coTeachingGroup.plans.length > 1;

    const currentPlan = await prisma.plans_tb.findUnique({
      where: { id: planId },
    });

    const isTransferOrFourYear =
      currentPlan &&
      (currentPlan.planType === "TRANSFER" || currentPlan.planType === "FOUR_YEAR");

    const updatedPlan = await prisma.plans_tb.update({
      where: { id: planId },
      data: updateData,
      include: {
        teacher: true,
        room: true,
        timetables: true,
      },
    });

    if (isCoTeaching && isTransferOrFourYear && body.section !== undefined) {
      const otherPlans = coTeachingGroup.plans.filter((p) => p.id !== planId);

      for (const otherPlan of otherPlans) {
        await prisma.plans_tb.update({
          where: { id: otherPlan.id },
          data: { section: body.section },
        });

        await prisma.timetable_tb.updateMany({
          where: { planId: otherPlan.id },
          data: { section: body.section },
        });
      }

      if (updatedPlan.timetables.length > 0) {
        await prisma.timetable_tb.updateMany({
          where: { planId: planId },
          data: { section: body.section },
        });
      }
    }

    if (isCoTeaching && sectionNumber !== undefined) {
      const otherPlans = coTeachingGroup.plans.filter((p) => p.id !== planId);

      for (const otherPlan of otherPlans) {
        await prisma.plans_tb.update({
          where: { id: otherPlan.id },
          data: { section: sectionNumber ? sectionNumber.toString() : null },
        });
      }
    }

    return updatedPlan;
  }

  /**
   * Deletes a subject plan and its corresponding timetable assignments.
   */
  static async deleteSubject(id: number) {
    return prisma.$transaction(async (tx) => {
      await tx.timetable_tb.deleteMany({
        where: { planId: id },
      });

      return tx.plans_tb.delete({
        where: { id },
      });
    });
  }

  /**
   * Updates only room reference of a subject plan.
   */
  static async updateSubjectRoom(subjectId: number, roomId: number | null) {
    return prisma.plans_tb.update({
      where: { id: subjectId },
      data: { roomId },
      include: {
        room: {
          select: {
            id: true,
            roomCode: true,
            roomType: true,
          },
        },
        teacher: {
          select: {
            id: true,
            tName: true,
            tLastName: true,
            tId: true,
          },
        },
      },
    });
  }

  /**
   * Updates only teacher reference of a subject plan.
   */
  static async updateSubjectTeacher(subjectId: number, teacherId: number | null) {
    return prisma.plans_tb.update({
      where: { id: subjectId },
      data: { teacherId },
      include: {
        room: {
          select: {
            id: true,
            roomCode: true,
            roomType: true,
          },
        },
        teacher: {
          select: {
            id: true,
            tName: true,
            tLastName: true,
            tId: true,
          },
        },
      },
    });
  }
}
