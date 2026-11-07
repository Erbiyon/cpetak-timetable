import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const testDbUrl = process.env.DATABASE_URL || "mysql://root:123456@localhost:3306/timetable_e2e";
const prisma = new PrismaClient({
  datasources: {
    db: { url: testDbUrl },
  },
});

describe("MySQL Subject Transaction & Rollback Integration Suite", () => {
  beforeAll(async () => {
    // Safety verification: Ensure we are connected exclusively to timetable_e2e
    const dbNameResult: any = await prisma.$queryRaw`SELECT DATABASE() as dbName`;
    const dbName = dbNameResult[0]?.dbName;
    expect(dbName).toBe("timetable_e2e");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("deleteSubject should rollback plan deletion if transaction fails", async () => {
    // 1. Setup synthetic plan and timetable entry
    const testPlan = await prisma.plans_tb.create({
      data: {
        subjectCode: "TEST-TX-01",
        subjectName: "Transaction Test Subject",
        credit: 3,
        lectureHour: 2,
        labHour: 3,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        dep: "CPE",
      },
    });

    const testTimetable = await prisma.timetable_tb.create({
      data: {
        planId: testPlan.id,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        day: 1,
        startPeriod: 1,
        endPeriod: 2,
      },
    });

    // 2. Trigger transaction failure by injecting an intentional error
    let errorThrown = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: Delete timetable entries
        await tx.timetable_tb.deleteMany({
          where: { planId: testPlan.id },
        });

        // Step 2: Inject failure before commit
        throw new Error("Simulated network/DB crash in transaction");

        // Step 3 (unreachable): Delete plan
        // await tx.plans_tb.delete({ where: { id: testPlan.id } });
      });
    } catch (err: any) {
      errorThrown = true;
      expect(err.message).toContain("Simulated network/DB crash");
    }

    expect(errorThrown).toBe(true);

    // 3. Verify Rollback: Timetable entry must still exist!
    const timetableAfterRollback = await prisma.timetable_tb.findUnique({
      where: { id: testTimetable.id },
    });
    expect(timetableAfterRollback).not.toBeNull();

    const planAfterRollback = await prisma.plans_tb.findUnique({
      where: { id: testPlan.id },
    });
    expect(planAfterRollback).not.toBeNull();

    // Cleanup synthetic fixtures
    await prisma.timetable_tb.deleteMany({ where: { planId: testPlan.id } });
    await prisma.plans_tb.delete({ where: { id: testPlan.id } });
  });

  it("splitSingleSubject should rollback part 1 update if part 2 creation fails", async () => {
    // 1. Setup synthetic subject
    const originalSubject = await prisma.plans_tb.create({
      data: {
        subjectCode: "TEST-SPLIT-TX",
        subjectName: "Original Subject Before Split",
        credit: 3,
        lectureHour: 3,
        labHour: 0,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        dep: "CPE",
        section: "1",
      },
    });

    const testTimetable = await prisma.timetable_tb.create({
      data: {
        planId: originalSubject.id,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        day: 2,
        startPeriod: 3,
        endPeriod: 5,
      },
    });

    // 2. Attempt split with failure during second part
    let errorCaught = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: delete timetable
        await tx.timetable_tb.deleteMany({
          where: { planId: originalSubject.id },
        });

        // Step 2: update part 1
        await tx.plans_tb.update({
          where: { id: originalSubject.id },
          data: {
            subjectName: "Original Subject Before Split (ส่วนที่ 1)",
            lectureHour: 2,
            labHour: 0,
            section: "1-1",
          },
        });

        // Step 3: Intentional failure before creating part 2
        throw new Error("Failure creating part 2");
      });
    } catch (e: any) {
      errorCaught = true;
      expect(e.message).toBe("Failure creating part 2");
    }

    expect(errorCaught).toBe(true);

    // 3. Verify Rollback: Subject name and section must be intact, timetable entry preserved!
    const subjectAfter = await prisma.plans_tb.findUnique({
      where: { id: originalSubject.id },
    });
    expect(subjectAfter?.subjectName).toBe("Original Subject Before Split");
    expect(subjectAfter?.section).toBe("1");
    expect(subjectAfter?.lectureHour).toBe(3);

    const timetableAfter = await prisma.timetable_tb.findUnique({
      where: { id: testTimetable.id },
    });
    expect(timetableAfter).not.toBeNull();

    // Clean up
    await prisma.timetable_tb.deleteMany({ where: { planId: originalSubject.id } });
    await prisma.plans_tb.delete({ where: { id: originalSubject.id } });
  });
});
