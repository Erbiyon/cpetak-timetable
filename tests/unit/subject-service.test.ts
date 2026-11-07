import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateCreateSubjectInput,
  validateUpdateSubjectInput,
  validateSplitSubjectInput,
} from "@/features/subjects/validations";
import { SubjectService } from "@/features/subjects/services/subject.service";
import { SubjectSplitService } from "@/features/subjects/services/subject-split.service";
import { SubjectMergeService } from "@/features/subjects/services/subject-merge.service";
import { CoTeachingService } from "@/features/subjects/services/co-teaching.service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plans_tb: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    timetable_tb: {
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    coTeaching_tb: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === "function") {
        return cb(prisma);
      }
      return cb;
    }),
  },
}));

describe("Subject Validations", () => {
  it("should validate valid create subject input", () => {
    const input = {
      subjectCode: "  CPE101 ",
      subjectName: " Computer Programming ",
      credit: "3",
      lectureHour: "2",
      labHour: "3",
      termYear: "1/2567",
      yearLevel: "ปี 1",
      planType: "FOUR_YEAR",
      dep: "CPE",
      roomId: "5",
      teacherId: "2",
      section: "1",
    };
    const result = validateCreateSubjectInput(input);
    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({
      subjectCode: "CPE101",
      subjectName: "Computer Programming",
      credit: 3,
      lectureHour: 2,
      labHour: 3,
      termYear: "1/2567",
      yearLevel: "ปี 1",
      planType: "FOUR_YEAR",
      dep: "CPE",
      roomId: 5,
      teacherId: 2,
      section: "1",
    });
  });

  it("should fail create validation when required fields are missing", () => {
    const result = validateCreateSubjectInput({
      subjectCode: "CPE101",
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("กรุณากรอกข้อมูลให้ครบถ้วน");
  });

  it("should validate update subject input correctly", () => {
    const result = validateUpdateSubjectInput({
      id: "10",
      subjectCode: "CPE102",
      credit: 4,
    });
    expect(result.isValid).toBe(true);
    expect(result.data?.id).toBe(10);
    expect(result.data?.subjectCode).toBe("CPE102");
    expect(result.data?.credit).toBe(4);
  });

  it("should validate split subject input correctly", () => {
    const result = validateSplitSubjectInput({
      subjectId: 15,
      splitData: {
        part1: { partNumber: 1, lectureHour: 2, labHour: 0 },
        part2: { partNumber: 2, lectureHour: 0, labHour: 3 },
      },
    });
    expect(result.isValid).toBe(true);
    expect(result.data?.subjectId).toBe(15);
  });
});

describe("SubjectService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getSubjects should filter by options and order by subjectCode asc", async () => {
    const mockSubjects = [{ id: 1, subjectCode: "CPE101" }];
    vi.mocked(prisma.plans_tb.findMany).mockResolvedValue(mockSubjects as any);

    const result = await SubjectService.getSubjects({
      termYear: "1/2567",
      yearLevel: "ปี 1",
      planType: "FOUR_YEAR",
      dep: "CPE",
    });

    expect(result).toEqual(mockSubjects);
    expect(prisma.plans_tb.findMany).toHaveBeenCalledWith({
      where: {
        termYear: { contains: "1/2567" },
        yearLevel: { contains: "ปี 1" },
        planType: { contains: "FOUR_YEAR" },
        dep: { contains: "CPE" },
      },
      include: expect.any(Object),
      orderBy: { subjectCode: "asc" },
    });
  });

  it("getSubjectById should find plan by ID", async () => {
    const mockSubject = { id: 1, subjectCode: "CPE101" };
    vi.mocked(prisma.plans_tb.findUnique).mockResolvedValue(mockSubject as any);

    const result = await SubjectService.getSubjectById(1);
    expect(result).toEqual(mockSubject);
    expect(prisma.plans_tb.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: expect.any(Object),
    });
  });

  it("deleteSubject should atomically delete timetable entries and plan", async () => {
    vi.mocked(prisma.plans_tb.delete).mockResolvedValue({ id: 1 } as any);

    const result = await SubjectService.deleteSubject(1);
    expect(result).toBeDefined();
    expect(prisma.timetable_tb.deleteMany).toHaveBeenCalledWith({
      where: { planId: 1 },
    });
    expect(prisma.plans_tb.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
});

describe("SubjectSplitService & SubjectMergeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("splitSingleSubject should update part 1 and create part 2 with section suffix", async () => {
    const originalSubject = {
      id: 10,
      subjectCode: "CPE201",
      subjectName: "Data Structures",
      credit: 3,
      section: "1",
      termYear: "1/2567",
      yearLevel: "ปี 2",
      planType: "FOUR_YEAR",
      dep: "CPE",
      roomId: 2,
      teacherId: 3,
    };

    vi.mocked(prisma.plans_tb.update).mockResolvedValue({
      id: 10,
      subjectName: "Data Structures (ส่วนที่ 1)",
      section: "1-1",
    } as any);

    vi.mocked(prisma.plans_tb.create).mockResolvedValue({
      id: 20,
      subjectName: "Data Structures (ส่วนที่ 2)",
      section: "1-2",
    } as any);

    const result = await SubjectSplitService.splitSingleSubject(originalSubject, {
      part1: { partNumber: 1, lectureHour: 2, labHour: 0 },
      part2: { partNumber: 2, lectureHour: 0, labHour: 3 },
    });

    expect(result.updatedSubject.section).toBe("1-1");
    expect(result.newSubject.section).toBe("1-2");
    expect(prisma.timetable_tb.deleteMany).toHaveBeenCalledWith({
      where: { planId: 10 },
    });
  });

  it("mergeSubjectParts should sum lecture/lab hours and revert section", async () => {
    const splitParts = [
      {
        id: 10,
        subjectName: "Data Structures (ส่วนที่ 1)",
        lectureHour: 2,
        labHour: 0,
        section: "1-1",
        roomId: 2,
        teacherId: 3,
      },
      {
        id: 20,
        subjectName: "Data Structures (ส่วนที่ 2)",
        lectureHour: 0,
        labHour: 3,
        section: "1-2",
        roomId: 2,
        teacherId: 3,
      },
    ];

    vi.mocked(prisma.plans_tb.update).mockResolvedValue({
      id: 10,
      subjectName: "Data Structures",
      lectureHour: 2,
      labHour: 3,
      section: "1",
    } as any);

    const merged = await SubjectMergeService.mergeSubjectParts(
      splitParts,
      "Data Structures",
    );
    expect(merged).toBeDefined();

    expect(prisma.timetable_tb.deleteMany).toHaveBeenCalledWith({
      where: { planId: { in: [10, 20] } },
    });
    expect(prisma.plans_tb.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: expect.objectContaining({
        subjectName: "Data Structures",
        lectureHour: 2,
        labHour: 3,
        section: "1",
      }),
      include: expect.any(Object),
    });
    expect(prisma.plans_tb.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [20] } },
    });
  });
});

describe("CoTeachingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checkGroup should return groupKey and planIds when group exists", async () => {
    vi.mocked(prisma.coTeaching_tb.findFirst).mockResolvedValue({
      id: 1,
      groupKey: "CPE301-1/2567",
      plans: [
        { id: 10, planType: "FOUR_YEAR", yearLevel: "ปี 3" },
        { id: 20, planType: "TRANSFER", yearLevel: "ปี 1" },
      ],
    } as any);

    const result = await CoTeachingService.checkGroup(10);
    expect(result.groupKey).toBe("CPE301-1/2567");
    expect(result.planIds).toEqual([10, 20]);
  });

  it("checkGroup should return empty array when no group found", async () => {
    vi.mocked(prisma.coTeaching_tb.findFirst).mockResolvedValue(null);

    const result = await CoTeachingService.checkGroup(99);
    expect(result.groupKey).toBeNull();
    expect(result.planIds).toEqual([]);
  });
});
