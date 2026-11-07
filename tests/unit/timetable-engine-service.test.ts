import { describe, it, expect, vi, beforeEach } from "vitest";
import { TimetableConflictService } from "@/features/timetable/services/timetable-conflict.service";
import { TimetableService } from "@/features/timetable/services/timetable.service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    timetable_tb: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    plans_tb: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    coTeaching_tb: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === "function") {
        return cb(prisma);
      }
      return cb;
    }),
  },
}));

describe("Timetable Conflict & Service Unit Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TimetableConflictService.checkConflicts", () => {
    it("should detect TIME_CONFLICT when period overlaps on same day, planType, and yearLevel", async () => {
      const mockTimeConflict = [
        {
          planId: 99,
          day: 1,
          startPeriod: 1,
          endPeriod: 3,
          plan: { subjectCode: "CPE100" },
          teacher: { tName: "Somchai" },
          room: { roomCode: "LAB01" },
          section: "1",
        },
      ];

      vi.mocked(prisma.timetable_tb.findMany)
        .mockResolvedValueOnce(mockTimeConflict as any) // Time conflicts
        .mockResolvedValueOnce([]) // Teacher conflicts
        .mockResolvedValueOnce([]); // Room conflicts

      vi.mocked(prisma.plans_tb.findUnique).mockResolvedValue(null);

      const conflicts = await TimetableConflictService.checkConflicts({
        planId: 10,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        day: 1,
        startPeriod: 2,
        endPeriod: 4,
        teacherId: 1,
        roomId: 1,
        section: "1",
      });

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe("TIME_CONFLICT");
      expect(conflicts[0].message).toBe("พบการซ้ำของเวลาเรียน");
    });

    it("should detect TEACHER_CONFLICT when teacher is scheduled elsewhere", async () => {
      vi.mocked(prisma.timetable_tb.findMany)
        .mockResolvedValueOnce([]) // No time conflict in this year/plan
        .mockResolvedValueOnce([
          {
            planId: 88,
            day: 1,
            startPeriod: 1,
            endPeriod: 3,
            teacher: { id: 5 },
          },
        ] as any) // Teacher conflict
        .mockResolvedValueOnce([]); // Room conflict

      vi.mocked(prisma.plans_tb.findUnique).mockResolvedValue(null);

      const conflicts = await TimetableConflictService.checkConflicts({
        planId: 10,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        day: 1,
        startPeriod: 2,
        endPeriod: 4,
        teacherId: 5,
      });

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe("TEACHER_CONFLICT");
      expect(conflicts[0].message).toBe("อาจารย์มีการสอนในเวลาดังกล่าวแล้ว");
    });

    it("should detect ROOM_CONFLICT when room is scheduled elsewhere", async () => {
      (prisma.timetable_tb.findMany as any).mockImplementation(async (args: any) => {
        if (args?.where?.roomId) {
          return [
            {
              planId: 77,
              day: 1,
              startPeriod: 1,
              endPeriod: 3,
              room: { id: 9 },
            },
          ];
        }
        return [];
      });

      vi.mocked(prisma.plans_tb.findUnique).mockResolvedValue(null);

      const conflicts = await TimetableConflictService.checkConflicts({
        planId: 10,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        day: 1,
        startPeriod: 2,
        endPeriod: 4,
        roomId: 9,
      });

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe("ROOM_CONFLICT");
      expect(conflicts[0].message).toBe("ห้องเรียนถูกใช้งานในเวลาดังกล่าวแล้ว");
    });

    it("should detect DUPLICATE_SECTION_CONFLICT across curricula", async () => {
      vi.mocked(prisma.timetable_tb.findMany)
        .mockResolvedValueOnce([]); // No time conflict

      vi.mocked(prisma.plans_tb.findUnique).mockResolvedValue({
        id: 10,
        subjectCode: "CPE201",
        termYear: "1/2567",
        planType: "FOUR_YEAR",
      } as any);

      vi.mocked(prisma.plans_tb.findMany).mockResolvedValue([
        {
          id: 20,
          subjectCode: "CPE201",
          planType: "TRANSFER",
          yearLevel: "ปี 1",
          section: "1",
          termYear: "1/2567",
        },
      ] as any);

      const conflicts = await TimetableConflictService.checkConflicts({
        planId: 10,
        termYear: "1/2567",
        yearLevel: "ปี 2",
        planType: "FOUR_YEAR",
        day: 1,
        startPeriod: 1,
        endPeriod: 3,
        section: "1",
      });

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe("DUPLICATE_SECTION_CONFLICT");
      expect(conflicts[0].message).toContain("กลุ่มเรียน 1 มีอยู่แล้วในแผนการเรียน: เทียบโอน ปี 1");
    });
  });

  describe("TimetableService.createTimetable", () => {
    it("should reject creation if conflicts exist", async () => {
      vi.mocked(prisma.coTeaching_tb.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.plans_tb.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.timetable_tb.findMany).mockResolvedValueOnce([
        {
          planId: 99,
          day: 1,
          startPeriod: 1,
          endPeriod: 3,
        } as any,
      ]);

      const result = await TimetableService.createTimetable({
        planId: 10,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        day: 1,
        startPeriod: 1,
        endPeriod: 3,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(409);
      expect(result.conflicts).toBeDefined();
      expect(prisma.timetable_tb.create).not.toHaveBeenCalled();
    });

    it("should atomically delete existing entries in non-term3 and create new timetable assignment", async () => {
      vi.mocked(prisma.coTeaching_tb.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.timetable_tb.findMany).mockResolvedValue([]);
      vi.mocked(prisma.plans_tb.findUnique).mockResolvedValue(null);

      const createdEntry = {
        id: 100,
        planId: 10,
        day: 1,
        startPeriod: 1,
        endPeriod: 3,
      };
      vi.mocked(prisma.timetable_tb.create).mockResolvedValue(createdEntry as any);

      const result = await TimetableService.createTimetable({
        planId: 10,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        day: 1,
        startPeriod: 1,
        endPeriod: 3,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(prisma.timetable_tb.deleteMany).toHaveBeenCalledWith({
        where: { planId: 10 },
      });
      expect(prisma.timetable_tb.create).toHaveBeenCalled();
    });
  });

  describe("TimetableService.deleteTimetable", () => {
    it("returns 404 when target plan is not found", async () => {
      vi.mocked(prisma.plans_tb.findUnique).mockResolvedValue(null);

      const result = await TimetableService.deleteTimetable({ planId: 999 });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(result.error).toBe("Plan not found");
      expect(prisma.timetable_tb.deleteMany).not.toHaveBeenCalled();
    });

    it("deletes single plan timetable for normal subjects", async () => {
      vi.mocked(prisma.plans_tb.findUnique).mockResolvedValue({
        id: 15,
        planType: "FOUR_YEAR",
      } as any);
      vi.mocked(prisma.coTeaching_tb.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.timetable_tb.deleteMany).mockResolvedValue({ count: 2 });

      const result = await TimetableService.deleteTimetable({ planId: 15 });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.deletedPlans).toEqual([15]);
      expect(result.deletedCount).toBe(2);
      expect(prisma.timetable_tb.deleteMany).toHaveBeenCalledWith({
        where: { planId: 15 },
      });
    });

    it("deletes all linked plans for Co-Teaching groups", async () => {
      vi.mocked(prisma.plans_tb.findUnique).mockResolvedValue({
        id: 10,
        planType: "TRANSFER",
      } as any);
      vi.mocked(prisma.coTeaching_tb.findFirst).mockResolvedValue({
        id: 1,
        plans: [{ id: 10 }, { id: 20 }],
      } as any);
      vi.mocked(prisma.timetable_tb.deleteMany).mockResolvedValue({ count: 4 });

      const result = await TimetableService.deleteTimetable({ planId: 10 });

      expect(result.success).toBe(true);
      expect(result.deletedPlans).toEqual([10, 20]);
      expect(result.deletedCount).toBe(4);
      expect(prisma.timetable_tb.deleteMany).toHaveBeenCalledWith({
        where: {
          planId: { in: [10, 20] },
        },
      });
    });

    it("synchronizes deletion across DVE paired curricula", async () => {
      vi.mocked(prisma.plans_tb.findUnique).mockResolvedValue({
        id: 101,
        planType: "DVE-MSIX",
        subjectCode: "DVE100",
        termYear: "1/2567",
        yearLevel: "1",
      } as any);
      vi.mocked(prisma.plans_tb.findMany).mockResolvedValue([
        { id: 202, planType: "DVE-LVC" } as any,
      ]);
      vi.mocked(prisma.timetable_tb.deleteMany).mockResolvedValue({ count: 2 });

      const result = await TimetableService.deleteTimetable({ planId: 101 });

      expect(result.success).toBe(true);
      expect(result.deletedPlans).toEqual([101, 202]);
      expect(prisma.timetable_tb.deleteMany).toHaveBeenCalledWith({
        where: {
          planId: { in: [101, 202] },
        },
      });
    });
  });

  describe("TimetableService.deleteTimetableRecord", () => {
    it("returns 404 when record is not found", async () => {
      vi.mocked(prisma.timetable_tb.findUnique).mockResolvedValue(null);

      const result = await TimetableService.deleteTimetableRecord({ recordId: 999 });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(result.error).toBe("Record not found");
      expect(prisma.timetable_tb.delete).not.toHaveBeenCalled();
    });

    it("deletes single record and returns deletedId and planId", async () => {
      vi.mocked(prisma.timetable_tb.findUnique).mockResolvedValue({
        id: 55,
        planId: 10,
        planType: "FOUR_YEAR",
        termYear: "1/2567",
      } as any);
      vi.mocked(prisma.timetable_tb.delete).mockResolvedValue({ id: 55 } as any);

      const result = await TimetableService.deleteTimetableRecord({ recordId: 55 });

      expect(result.success).toBe(true);
      expect(result.deletedId).toBe(55);
      expect(result.planId).toBe(10);
      expect(prisma.timetable_tb.delete).toHaveBeenCalledWith({
        where: { id: 55 },
      });
    });
  });

  describe("TimetableService.clearTimetable", () => {
    it("rejects clear operation if required parameters are missing", async () => {
      const result = await TimetableService.clearTimetable({
        termYear: "",
        yearLevel: "1",
        planType: "FOUR_YEAR",
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.error).toBe("Missing required parameters");
      expect(prisma.timetable_tb.deleteMany).not.toHaveBeenCalled();
    });

    it("deletes all records strictly within given curriculum scope", async () => {
      vi.mocked(prisma.timetable_tb.deleteMany).mockResolvedValue({ count: 12 });

      const result = await TimetableService.clearTimetable({
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.deletedCount).toBe(12);
      expect(prisma.timetable_tb.deleteMany).toHaveBeenCalledWith({
        where: {
          termYear: "1/2567",
          yearLevel: "ปี 1",
          planType: "FOUR_YEAR",
        },
      });
    });
  });

  describe("TimetableService.getTimetables", () => {
    it("queries by roomId when roomId is provided", async () => {
      vi.mocked(prisma.timetable_tb.findMany).mockResolvedValue([{ id: 1 }] as any);

      const result = await TimetableService.getTimetables({
        roomId: 5,
        termYear: "1/2567",
      });

      expect(result).toEqual([{ id: 1 }]);
      expect(prisma.timetable_tb.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { roomId: 5, termYear: "1/2567" },
        })
      );
    });

    it("queries by teacherId when teacherId is provided", async () => {
      vi.mocked(prisma.timetable_tb.findMany).mockResolvedValue([{ id: 2 }] as any);

      const result = await TimetableService.getTimetables({
        teacherId: 10,
        termYear: "1/2567",
      });

      expect(result).toEqual([{ id: 2 }]);
      expect(prisma.timetable_tb.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teacherId: 10, termYear: "1/2567" },
        })
      );
    });

    it("queries by curriculum coordinates when roomId and teacherId are omitted", async () => {
      vi.mocked(prisma.timetable_tb.findMany).mockResolvedValue([{ id: 3 }] as any);

      const result = await TimetableService.getTimetables({
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
      });

      expect(result).toEqual([{ id: 3 }]);
      expect(prisma.timetable_tb.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            termYear: "1/2567",
            yearLevel: "ปี 1",
            planType: "FOUR_YEAR",
          },
        })
      );
    });
  });
});
