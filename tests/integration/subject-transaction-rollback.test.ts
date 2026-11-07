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

    let errorThrown = false;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.timetable_tb.deleteMany({
          where: { planId: testPlan.id },
        });
        throw new Error("Simulated network/DB crash in transaction");
      });
    } catch (err: any) {
      errorThrown = true;
      expect(err.message).toContain("Simulated network/DB crash");
    }

    expect(errorThrown).toBe(true);

    const timetableAfterRollback = await prisma.timetable_tb.findUnique({
      where: { id: testTimetable.id },
    });
    expect(timetableAfterRollback).not.toBeNull();

    const planAfterRollback = await prisma.plans_tb.findUnique({
      where: { id: testPlan.id },
    });
    expect(planAfterRollback).not.toBeNull();

    await prisma.timetable_tb.deleteMany({ where: { planId: testPlan.id } });
    await prisma.plans_tb.delete({ where: { id: testPlan.id } });
  });

  it("splitSingleSubject should rollback part 1 update if part 2 creation fails", async () => {
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

    let errorCaught = false;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.timetable_tb.deleteMany({
          where: { planId: originalSubject.id },
        });

        await tx.plans_tb.update({
          where: { id: originalSubject.id },
          data: {
            subjectName: "Original Subject Before Split (ส่วนที่ 1)",
            lectureHour: 2,
            labHour: 0,
            section: "1-1",
          },
        });

        throw new Error("Failure creating part 2");
      });
    } catch (e: any) {
      errorCaught = true;
      expect(e.message).toBe("Failure creating part 2");
    }

    expect(errorCaught).toBe(true);

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

    await prisma.timetable_tb.deleteMany({ where: { planId: originalSubject.id } });
    await prisma.plans_tb.delete({ where: { id: originalSubject.id } });
  });

  it("mergeSubjectParts should rollback plan update and timetable deletion if part deletion fails", async () => {
    // 1. Setup split parts with timetable assignments
    const part1 = await prisma.plans_tb.create({
      data: {
        subjectCode: "TEST-MERGE-TX",
        subjectName: "Merge Subject (ส่วนที่ 1)",
        credit: 3,
        lectureHour: 2,
        labHour: 0,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        dep: "CPE",
        section: "1-1",
      },
    });

    const part2 = await prisma.plans_tb.create({
      data: {
        subjectCode: "TEST-MERGE-TX",
        subjectName: "Merge Subject (ส่วนที่ 2)",
        credit: 3,
        lectureHour: 0,
        labHour: 3,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        dep: "CPE",
        section: "1-2",
      },
    });

    const timetablePart1 = await prisma.timetable_tb.create({
      data: {
        planId: part1.id,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "FOUR_YEAR",
        day: 1,
        startPeriod: 1,
        endPeriod: 2,
      },
    });

    // 2. Perform merge within transaction and inject failure
    let errorCaught = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: Delete timetable entries for both parts
        await tx.timetable_tb.deleteMany({
          where: { planId: { in: [part1.id, part2.id] } },
        });

        // Step 2: Update part 1 to restored base
        await tx.plans_tb.update({
          where: { id: part1.id },
          data: {
            subjectName: "Merge Subject",
            lectureHour: 2,
            labHour: 3,
            section: "1",
          },
        });

        // Step 3: Inject controlled failure before deleting part 2
        throw new Error("Controlled failure during merge transaction");
      });
    } catch (e: any) {
      errorCaught = true;
      expect(e.message).toBe("Controlled failure during merge transaction");
    }

    expect(errorCaught).toBe(true);

    // 3. Verify Rollback: Part 1 remains split name, Part 2 still exists, Timetable still exists!
    const part1After = await prisma.plans_tb.findUnique({ where: { id: part1.id } });
    expect(part1After?.subjectName).toBe("Merge Subject (ส่วนที่ 1)");
    expect(part1After?.section).toBe("1-1");

    const part2After = await prisma.plans_tb.findUnique({ where: { id: part2.id } });
    expect(part2After).not.toBeNull();

    const timetableAfter = await prisma.timetable_tb.findUnique({ where: { id: timetablePart1.id } });
    expect(timetableAfter).not.toBeNull();

    // Cleanup
    await prisma.timetable_tb.deleteMany({ where: { planId: { in: [part1.id, part2.id] } } });
    await prisma.plans_tb.deleteMany({ where: { id: { in: [part1.id, part2.id] } } });
  });

  it("co-teaching operations should rollback group and plans connect/disconnect on failure", async () => {
    // 1. Setup synthetic plans
    const planA = await prisma.plans_tb.create({
      data: {
        subjectCode: "TEST-CO-TX",
        subjectName: "CoTeaching Test A",
        credit: 3,
        lectureHour: 3,
        labHour: 0,
        termYear: "1/2567",
        yearLevel: "ปี 3",
        planType: "FOUR_YEAR",
        dep: "CPE",
      },
    });

    const planB = await prisma.plans_tb.create({
      data: {
        subjectCode: "TEST-CO-TX",
        subjectName: "CoTeaching Test B",
        credit: 3,
        lectureHour: 3,
        labHour: 0,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "TRANSFER",
        dep: "CPE",
      },
    });

    // 2. Test rollback during connect
    let connectError = false;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.coTeaching_tb.create({
          data: {
            groupKey: "TEST-CO-TX-1/2567",
            plans: { connect: [{ id: planA.id }, { id: planB.id }] },
          },
        });
        throw new Error("Crash during co-teaching creation");
      });
    } catch (e: any) {
      connectError = true;
      expect(e.message).toBe("Crash during co-teaching creation");
    }

    expect(connectError).toBe(true);

    // Verify group was not created
    const groupAfter = await prisma.coTeaching_tb.findUnique({
      where: { groupKey: "TEST-CO-TX-1/2567" },
    });
    expect(groupAfter).toBeNull();

    // Cleanup
    await prisma.plans_tb.deleteMany({ where: { id: { in: [planA.id, planB.id] } } });
  });

  it("DVE cross-curriculum synchronization should rollback both DVE plans if second update fails", async () => {
    // 1. Setup synchronized DVE pair
    const dveMs = await prisma.plans_tb.create({
      data: {
        subjectCode: "TEST-DVE-SYNC",
        subjectName: "DVE Subject MSIX",
        credit: 3,
        lectureHour: 3,
        labHour: 0,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "DVE-MSIX",
        dep: "CPE",
        section: "1",
      },
    });

    const dveLvc = await prisma.plans_tb.create({
      data: {
        subjectCode: "TEST-DVE-SYNC",
        subjectName: "DVE Subject LVC",
        credit: 3,
        lectureHour: 3,
        labHour: 0,
        termYear: "1/2567",
        yearLevel: "ปี 1",
        planType: "DVE-LVC",
        dep: "CPE",
        section: "1",
      },
    });

    // 2. Perform synchronized split and inject failure between MS and LVC
    let syncError = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: Update MSIX part 1
        await tx.plans_tb.update({
          where: { id: dveMs.id },
          data: {
            subjectName: "DVE Subject MSIX (ส่วนที่ 1)",
            section: "1-1",
          },
        });

        // Step 2: Inject failure before LVC update
        throw new Error("Crash before synchronizing DVE-LVC");
      });
    } catch (e: any) {
      syncError = true;
      expect(e.message).toBe("Crash before synchronizing DVE-LVC");
    }

    expect(syncError).toBe(true);

    // 3. Verify Rollback: MSIX must be reverted to original name and section
    const msAfter = await prisma.plans_tb.findUnique({ where: { id: dveMs.id } });
    expect(msAfter?.subjectName).toBe("DVE Subject MSIX");
    expect(msAfter?.section).toBe("1");

    const lvcAfter = await prisma.plans_tb.findUnique({ where: { id: dveLvc.id } });
    expect(lvcAfter?.subjectName).toBe("DVE Subject LVC");
    expect(lvcAfter?.section).toBe("1");

    // Cleanup
    await prisma.plans_tb.deleteMany({ where: { id: { in: [dveMs.id, dveLvc.id] } } });
  });
});
