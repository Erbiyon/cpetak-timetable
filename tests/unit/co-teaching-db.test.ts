import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkCoTeachingGroup,
  handleCoTeachingSplit,
  handleCoTeachingMerge,
  findCoTeachingSubjects,
} from "@/utils/co-teaching-helper";
import { prisma } from "@/lib/prisma";

// Mock the prisma client for unit/regression testing
vi.mock("@/lib/prisma", () => ({
  prisma: {
    coTeaching_tb: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    plans_tb: {
      findMany: vi.fn(),
    },
  },
}));

describe("Co-Teaching Database Operations (utils/co-teaching-helper.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkCoTeachingGroup", () => {
    it("returns null when no co-teaching group is found", async () => {
      (prisma.coTeaching_tb.findFirst as any).mockResolvedValueOnce(null);

      const result = await checkCoTeachingGroup(999);
      expect(result).toBeNull();
      expect(prisma.coTeaching_tb.findFirst).toHaveBeenCalledWith({
        where: { plans: { some: { id: 999 } } },
        include: expect.any(Object),
      });
    });

    it("returns mapped group data when co-teaching group exists", async () => {
      const mockGroup = {
        id: 1,
        groupKey: "CPE101-1/2567",
        plans: [
          { id: 101, planType: "TRANSFER", yearLevel: "1", subjectCode: "CPE101", termYear: "1/2567" },
          { id: 102, planType: "FOUR_YEAR", yearLevel: "1", subjectCode: "CPE101", termYear: "1/2567" },
        ],
      };
      (prisma.coTeaching_tb.findFirst as any).mockResolvedValueOnce(mockGroup);

      const result = await checkCoTeachingGroup(101);
      expect(result).toEqual({
        groupKey: "CPE101-1/2567",
        planIds: [101, 102],
        plans: mockGroup.plans,
      });
    });
  });

  describe("handleCoTeachingSplit", () => {
    it("disconnects old plans, removes empty group, and creates two new groups", async () => {
      const mockOriginalGroup = {
        id: 5,
        groupKey: "CPE201-1/2567",
        plans: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      };
      (prisma.coTeaching_tb.findUnique as any)
        .mockResolvedValueOnce(mockOriginalGroup) // Initial check
        .mockResolvedValueOnce({ id: 5, plans: [] }); // After disconnect, group is empty

      (prisma.coTeaching_tb.update as any).mockResolvedValueOnce({});
      (prisma.coTeaching_tb.delete as any).mockResolvedValueOnce({});
      (prisma.coTeaching_tb.create as any)
        .mockResolvedValueOnce({ id: 6, groupKey: "CPE201-1-1/2567" })
        .mockResolvedValueOnce({ id: 7, groupKey: "CPE201-2-1/2567" });

      const splitResult = await handleCoTeachingSplit(
        "CPE201-1/2567",
        { part1Ids: [1, 2], part2Ids: [3, 4] },
        "CPE201",
        "1/2567",
        { part1: 1, part2: 2 }
      );

      expect(splitResult.success).toBe(true);
      expect(splitResult.newGroupKeys.part1).toBe("CPE201-1-1/2567");
      expect(splitResult.newGroupKeys.part2).toBe("CPE201-2-1/2567");

      expect(prisma.coTeaching_tb.delete).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(prisma.coTeaching_tb.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("handleCoTeachingMerge", () => {
    it("deletes related existing groups and connects plans into single original group", async () => {
      (prisma.plans_tb.findMany as any).mockResolvedValueOnce([
        { id: 10, subjectCode: "CPE301", termYear: "1/2567", planType: "TRANSFER", subjectName: "CPE301" },
        { id: 20, subjectCode: "CPE301", termYear: "1/2567", planType: "FOUR_YEAR", subjectName: "CPE301" },
      ]);
      (prisma.coTeaching_tb.findMany as any).mockResolvedValueOnce([
        { id: 11, groupKey: "CPE301-1-1/2567", plans: [{ id: 10 }] },
        { id: 12, groupKey: "CPE301-2-1/2567", plans: [{ id: 20 }] },
      ]);
      (prisma.coTeaching_tb.delete as any).mockResolvedValue({});
      (prisma.coTeaching_tb.create as any).mockResolvedValueOnce({
        id: 13,
        groupKey: "CPE301-1/2567",
      });

      const mergeResult = await handleCoTeachingMerge("CPE301", "1/2567", [10, 20]);

      expect(mergeResult.success).toBe(true);
      expect(mergeResult.newGroupKey).toBe("CPE301-1/2567");
      expect(prisma.coTeaching_tb.delete).toHaveBeenCalledTimes(2);
      expect(prisma.coTeaching_tb.create).toHaveBeenCalledWith({
        data: {
          groupKey: "CPE301-1/2567",
          plans: {
            connect: [{ id: 10 }, { id: 20 }],
          },
        },
      });
    });
  });

  describe("findCoTeachingSubjects", () => {
    it("queries plans_tb for TRANSFER and FOUR_YEAR plan types", async () => {
      const mockSubjects = [
        { id: 1, subjectCode: "CPE100", termYear: "1/2567", planType: "TRANSFER", room: null, teacher: null },
      ];
      (prisma.plans_tb.findMany as any).mockResolvedValueOnce(mockSubjects);

      const subjects = await findCoTeachingSubjects("CPE100", "1/2567");
      expect(subjects).toEqual(mockSubjects);
      expect(prisma.plans_tb.findMany).toHaveBeenCalledWith({
        where: {
          subjectCode: "CPE100",
          termYear: "1/2567",
          planType: { in: ["TRANSFER", "FOUR_YEAR"] },
        },
        include: { room: true, teacher: true },
      });
    });
  });
});

