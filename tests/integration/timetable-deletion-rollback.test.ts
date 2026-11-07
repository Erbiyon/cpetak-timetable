import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { TimetableService } from "@/features/timetable/services/timetable.service";

const testDbUrl = process.env.DATABASE_URL || "mysql://root:123456@localhost:3306/timetable_e2e";
const prisma = new PrismaClient({
  datasources: {
    db: { url: testDbUrl },
  },
});

describe("MySQL Timetable Deletion & Clear Integration Suite", () => {
  beforeAll(async () => {
    const dbNameResult: any = await prisma.$queryRaw`SELECT DATABASE() as dbName`;
    const dbName = dbNameResult[0]?.dbName;
    expect(dbName).toBe("timetable_e2e");
  });

  afterAll(async () => {
    // Cleanup any lingering test fixtures
    await prisma.timetable_tb.deleteMany({
      where: {
        plan: {
          subjectCode: { startsWith: "TEST-TT-" },
        },
      },
    });
    await prisma.plans_tb.deleteMany({
      where: {
        subjectCode: { startsWith: "TEST-TT-" },
      },
    });
    await prisma.$disconnect();
  });

  it("deleteTimetable should atomically delete timetable entries for a single plan", async () => {
    const plan = await prisma.plans_tb.create({
      data: {
        subjectCode: "TEST-TT-01",
        subjectName: "Test Timetable Single Plan",
        credit: 3,
        lectureHour: 2,
        labHour: 2,
        planType: "FOUR_YEAR",
        termYear: "1/2567",
        yearLevel: "ปี 1",
      },
    });

    await prisma.timetable_tb.create({
      data: {
        planId: plan.id,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        day: 1,
        startPeriod: 1,
        endPeriod: 3,
      },
    });

    const delResult = await TimetableService.deleteTimetable({ planId: plan.id });
    expect(delResult.success).toBe(true);
    expect(delResult.deletedCount).toBe(1);

    const remaining = await prisma.timetable_tb.findMany({
      where: { planId: plan.id },
    });
    expect(remaining.length).toBe(0);
  });

  it("deleteTimetableRecord should delete only specific assignment record and preserve others", async () => {
    const plan = await prisma.plans_tb.create({
      data: {
        subjectCode: "TEST-TT-02",
        subjectName: "Test Multi Record Subject",
        credit: 3,
        lectureHour: 2,
        labHour: 2,
        planType: "FOUR_YEAR",
        termYear: "3/2567",
        yearLevel: "ปี 1",
      },
    });

    const rec1 = await prisma.timetable_tb.create({
      data: {
        planId: plan.id,
        termYear: "3/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        day: 1,
        startPeriod: 1,
        endPeriod: 3,
      },
    });

    const rec2 = await prisma.timetable_tb.create({
      data: {
        planId: plan.id,
        termYear: "3/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        day: 3,
        startPeriod: 4,
        endPeriod: 6,
      },
    });

    const delResult = await TimetableService.deleteTimetableRecord({ recordId: rec1.id });
    expect(delResult.success).toBe(true);
    expect(delResult.deletedId).toBe(rec1.id);

    // Verify rec2 remains intact
    const remaining = await prisma.timetable_tb.findMany({
      where: { planId: plan.id },
    });
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(rec2.id);
  });

  it("clearTimetable should delete records strictly within bounded curriculum scope", async () => {
    const planA = await prisma.plans_tb.create({
      data: {
        subjectCode: "TEST-TT-03A",
        subjectName: "Scope Target Plan",
        credit: 3,
        lectureHour: 2,
        labHour: 2,
        planType: "FOUR_YEAR",
        termYear: "1/2567",
        yearLevel: "ปี 2",
      },
    });

    const planB = await prisma.plans_tb.create({
      data: {
        subjectCode: "TEST-TT-03B",
        subjectName: "Out of Scope Plan",
        credit: 3,
        lectureHour: 2,
        labHour: 2,
        planType: "FOUR_YEAR",
        termYear: "1/2567",
        yearLevel: "ปี 3", // Different year level!
      },
    });

    await prisma.timetable_tb.create({
      data: {
        planId: planA.id,
        termYear: "1/2567",
        yearLevel: "ปี 2",
        planType: "FOUR_YEAR",
        day: 1,
        startPeriod: 1,
        endPeriod: 3,
      },
    });

    const keepEntry = await prisma.timetable_tb.create({
      data: {
        planId: planB.id,
        termYear: "1/2567",
        yearLevel: "ปี 3",
        planType: "FOUR_YEAR",
        day: 2,
        startPeriod: 1,
        endPeriod: 3,
      },
    });

    const clearResult = await TimetableService.clearTimetable({
      termYear: "1/2567",
      yearLevel: "ปี 2",
      planType: "FOUR_YEAR",
    });

    expect(clearResult.success).toBe(true);
    expect(clearResult.deletedCount).toBeGreaterThanOrEqual(1);

    // Verify planB entry in Year 3 was NOT deleted
    const kept = await prisma.timetable_tb.findUnique({
      where: { id: keepEntry.id },
    });
    expect(kept).not.toBeNull();
  });
});
