import { prisma } from "@/lib/prisma";

export class CoTeachingService {
  /**
   * Checks co-teaching group membership and returns related details.
   */
  static async checkGroup(subjectId: number) {
    const group = await prisma.coTeaching_tb.findFirst({
      where: {
        plans: {
          some: { id: subjectId },
        },
      },
      include: {
        plans: {
          select: {
            id: true,
            planType: true,
            yearLevel: true,
          },
        },
      },
    });

    if (!group) {
      return { groupKey: null, planIds: [], details: [] };
    }

    return {
      groupKey: group.groupKey,
      planIds: group.plans.map((p) => p.id),
      details: group.plans.map((p) => ({
        id: p.id,
        planType: p.planType,
        yearLevel: p.yearLevel,
      })),
    };
  }

  /**
   * Connects planIds into a co-teaching group.
   */
  static async connectPlans(groupKey: string, planIds: number[]) {
    const group = await prisma.coTeaching_tb.findUnique({ where: { groupKey } });
    if (!group) {
      await prisma.coTeaching_tb.create({
        data: {
          groupKey,
          plans: { connect: planIds.map((id: number) => ({ id })) },
        },
      });
    } else {
      await prisma.coTeaching_tb.update({
        where: { id: group.id },
        data: { plans: { connect: planIds.map((id: number) => ({ id })) } },
      });
    }
    return { success: true };
  }

  /**
   * Disconnects planIds from a co-teaching group, deleting the group if empty.
   */
  static async disconnectPlans(groupKey: string, planIds: number[]) {
    const group = await prisma.coTeaching_tb.findUnique({
      where: { groupKey },
      include: { plans: true },
    });
    if (!group) return { success: true };

    await prisma.coTeaching_tb.update({
      where: { id: group.id },
      data: { plans: { disconnect: planIds.map((id: number) => ({ id })) } },
    });

    const updated = await prisma.coTeaching_tb.findUnique({
      where: { id: group.id },
      include: { plans: true },
    });
    if (updated && updated.plans.length === 0) {
      await prisma.coTeaching_tb.delete({ where: { id: group.id } });
    }

    return { success: true };
  }
}
