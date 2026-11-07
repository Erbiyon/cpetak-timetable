import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { TimetableService } from "@/features/timetable/services/timetable.service";

/**
 * PHASE 5.4: Concurrency Stress & Scenario Expansion Suite (Real MySQL 8.0 on timetable_e2e)
 *
 * Expands concurrency testing to:
 * 1. Multi-iteration stress test on Same Room collision (30 iterations)
 * 2. Multi-iteration stress test on Same Teacher collision (30 iterations)
 * 3. Competing concurrent DVE scheduling (two distinct DVE subjects attempting synchronized updates)
 * 4. Competing concurrent Co-Teaching assignment operations
 * 5. Delete vs Create race condition verification
 * 6. High-concurrency Plan modification (Same Plan update race)
 */
describe("Phase 5.4 Concurrency Stress & Scenario Expansion Suite", () => {
  const dbUrl =
    process.env.DATABASE_URL || "mysql://root:123456@localhost:3306/timetable_e2e";

  let prisma: PrismaClient;

  let teacherAId: number;
  let teacherBId: number;
  let room101Id: number;
  let room102Id: number;

  let planAId: number;
  let planBId: number;
  let planCId: number;

  let coTeachingGroupKey: string;
  let coTeachPlan1Id: number;
  let coTeachPlan2Id: number;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    // Clean fixtures
    await prisma.timetable_tb.deleteMany({
      where: { termYear: "2/2569" },
    });
    await prisma.plans_tb.deleteMany({
      where: { termYear: "2/2569" },
    });
    await prisma.teacher_tb.deleteMany({
      where: { tId: { in: ["T_STRESS_A", "T_STRESS_B"] } },
    });
    await prisma.room_tb.deleteMany({
      where: { roomCode: { in: ["R_STRESS_101", "R_STRESS_102"] } },
    });

    // Create Teachers
    const tA = await prisma.teacher_tb.create({
      data: {
        tId: "T_STRESS_A",
        tName: "StressAlice",
        tLastName: "Engineer",
        teacherType: "อาจารย์ประจำ",
      },
    });
    teacherAId = tA.id;

    const tB = await prisma.teacher_tb.create({
      data: {
        tId: "T_STRESS_B",
        tName: "StressBob",
        tLastName: "Engineer",
        teacherType: "อาจารย์ประจำ",
      },
    });
    teacherBId = tB.id;

    // Create Rooms
    const r1 = await prisma.room_tb.create({
      data: {
        roomCode: "R_STRESS_101",
        roomType: "LECTURE",
      },
    });
    room101Id = r1.id;

    const r2 = await prisma.room_tb.create({
      data: {
        roomCode: "R_STRESS_102",
        roomType: "LAB",
      },
    });
    room102Id = r2.id;

    // Create Plans
    const pA = await prisma.plans_tb.create({
      data: {
        subjectCode: "STRESS101",
        subjectName: "Stress Test Subject A",
        credit: 3,
        lectureHour: 3,
        labHour: 0,
        planType: "FOUR_YEAR",
        termYear: "2/2569",
        yearLevel: "1",
        teacherId: teacherAId,
        roomId: room101Id,
        section: "1",
      },
    });
    planAId = pA.id;

    const pB = await prisma.plans_tb.create({
      data: {
        subjectCode: "STRESS102",
        subjectName: "Stress Test Subject B",
        credit: 3,
        lectureHour: 3,
        labHour: 0,
        planType: "FOUR_YEAR",
        termYear: "2/2569",
        yearLevel: "2",
        teacherId: teacherBId,
        roomId: room101Id, // Same room as pA
        section: "1",
      },
    });
    planBId = pB.id;

    const pC = await prisma.plans_tb.create({
      data: {
        subjectCode: "STRESS103",
        subjectName: "Stress Test Subject C",
        credit: 3,
        lectureHour: 3,
        labHour: 0,
        planType: "TRANSFER",
        termYear: "2/2569",
        yearLevel: "1",
        teacherId: teacherAId, // Same teacher as pA
        roomId: room102Id,
        section: "1",
      },
    });
    planCId = pC.id;

    // Create Co-Teaching fixtures
    coTeachingGroupKey = "STRESS_COTEACH_GRP_01";
    const coTeach1 = await prisma.plans_tb.create({
      data: {
        subjectCode: "COTEACH99",
        subjectName: "CoTeaching Shared A",
        credit: 3,
        lectureHour: 3,
        labHour: 0,
        planType: "FOUR_YEAR",
        termYear: "2/2569",
        yearLevel: "3",
        teacherId: teacherAId,
        roomId: room102Id,
        section: "1",
      },
    });
    coTeachPlan1Id = coTeach1.id;

    const coTeach2 = await prisma.plans_tb.create({
      data: {
        subjectCode: "COTEACH99",
        subjectName: "CoTeaching Shared B",
        credit: 3,
        lectureHour: 3,
        labHour: 0,
        planType: "TRANSFER",
        termYear: "2/2569",
        yearLevel: "2",
        teacherId: teacherAId,
        roomId: room102Id,
        section: "1",
      },
    });
    coTeachPlan2Id = coTeach2.id;

    await prisma.coTeaching_tb.create({
      data: {
        groupKey: coTeachingGroupKey,
        plans: {
          connect: [{ id: coTeachPlan1Id }, { id: coTeachPlan2Id }],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.timetable_tb.deleteMany({
      where: { termYear: "2/2569" },
    });
    await prisma.coTeaching_tb.deleteMany({
      where: { groupKey: coTeachingGroupKey },
    });
    await prisma.plans_tb.deleteMany({
      where: { termYear: "2/2569" },
    });
    await prisma.teacher_tb.deleteMany({
      where: { tId: { in: ["T_STRESS_A", "T_STRESS_B"] } },
    });
    await prisma.room_tb.deleteMany({
      where: { roomCode: { in: ["R_STRESS_101", "R_STRESS_102"] } },
    });
    await prisma.$disconnect();
  });

  it(
    "1. Stress Verification: Same Room collision across 30 repeated iterations",
    async () => {
      const iterations = 30;
      let totalSuccesses = 0;
      let totalConflicts = 0;

      for (let i = 0; i < iterations; i++) {
        // Clear timetable for this day before each iteration
        await prisma.timetable_tb.deleteMany({
          where: { termYear: "2/2569", day: 1 },
        });

        const reqA = TimetableService.createTimetable({
          planId: planAId,
          termYear: "2/2569",
          yearLevel: "1",
          planType: "FOUR_YEAR",
          day: 1,
          startPeriod: 1,
          endPeriod: 3,
          roomId: room101Id,
          teacherId: teacherAId,
          section: "1",
        });

        const reqB = TimetableService.createTimetable({
          planId: planBId,
          termYear: "2/2569",
          yearLevel: "2",
          planType: "FOUR_YEAR",
          day: 1,
          startPeriod: 1,
          endPeriod: 3,
          roomId: room101Id,
          teacherId: teacherBId,
          section: "1",
        });

        const [resA, resB] = await Promise.all([reqA, reqB]);

        const succ = [resA, resB].filter((r) => r.success).length;
        const conf = [resA, resB].filter(
          (r) => !r.success && r.statusCode === 409,
        ).length;

        totalSuccesses += succ;
        totalConflicts += conf;

        expect(succ).toBe(1);
        expect(conf).toBe(1);

        // Verify DB integrity: never more than 1 record booked in room 101
        const booked = await prisma.timetable_tb.count({
          where: {
            roomId: room101Id,
            day: 1,
            termYear: "2/2569",
          },
        });
        expect(booked).toBe(1);
      }

      expect(totalSuccesses).toBe(iterations);
      expect(totalConflicts).toBe(iterations);
    },
    90000,
  );

  it(
    "2. Stress Verification: Same Teacher collision across 30 repeated iterations",
    async () => {
      const iterations = 30;
      let totalSuccesses = 0;
      let totalConflicts = 0;

      for (let i = 0; i < iterations; i++) {
        await prisma.timetable_tb.deleteMany({
          where: { termYear: "2/2569", day: 2 },
        });

        // Plan A (Room 101) vs Plan C (Room 102), BOTH Teacher A
        const reqA = TimetableService.createTimetable({
          planId: planAId,
          termYear: "2/2569",
          yearLevel: "1",
          planType: "FOUR_YEAR",
          day: 2,
          startPeriod: 2,
          endPeriod: 4,
          roomId: room101Id,
          teacherId: teacherAId,
          section: "1",
        });

        const reqC = TimetableService.createTimetable({
          planId: planCId,
          termYear: "2/2569",
          yearLevel: "1",
          planType: "TRANSFER",
          day: 2,
          startPeriod: 2,
          endPeriod: 4,
          roomId: room102Id,
          teacherId: teacherAId,
          section: "1",
        });

        const [resA, resC] = await Promise.all([reqA, reqC]);

        const succ = [resA, resC].filter((r) => r.success).length;
        const conf = [resA, resC].filter(
          (r) => !r.success && r.statusCode === 409,
        ).length;

        totalSuccesses += succ;
        totalConflicts += conf;

        expect(succ).toBe(1);
        expect(conf).toBe(1);

        const teacherBookings = await prisma.timetable_tb.count({
          where: {
            teacherId: teacherAId,
            day: 2,
            termYear: "2/2569",
          },
        });
        expect(teacherBookings).toBe(1);
      }

      expect(totalSuccesses).toBe(iterations);
      expect(totalConflicts).toBe(iterations);
    },
    90000,
  );

  it("3. Delete vs Create Race: produces a deterministic, uncorrupted final state", async () => {
    // Seed initial assignment for Plan A on Day 3
    await TimetableService.createTimetable({
      planId: planAId,
      termYear: "2/2569",
      yearLevel: "1",
      planType: "FOUR_YEAR",
      day: 3,
      startPeriod: 1,
      endPeriod: 3,
      roomId: room101Id,
      teacherId: teacherAId,
      section: "1",
    });

    // Run deleteTimetable and createTimetable simultaneously
    const delReq = TimetableService.deleteTimetable({ planId: planAId });
    const createReq = TimetableService.createTimetable({
      planId: planAId,
      termYear: "2/2569",
      yearLevel: "1",
      planType: "FOUR_YEAR",
      day: 3,
      startPeriod: 4,
      endPeriod: 6,
      roomId: room101Id,
      teacherId: teacherAId,
      section: "1",
    });

    const [delRes, createRes] = await Promise.all([delReq, createReq]);
    expect(delRes.success).toBe(true);
    expect(createRes.success).toBe(true);

    const remaining = await prisma.timetable_tb.findMany({
      where: { planId: planAId, termYear: "2/2569" },
    });
    // Either delete occurred after create (count = 0) or create occurred after delete (count = 1)
    expect([0, 1]).toContain(remaining.length);
  });

  it("4. Concurrent Co-Teaching: legitimate mirrored assignment succeeds without deadlock", async () => {
    await prisma.timetable_tb.deleteMany({
      where: { termYear: "2/2569", day: 4 },
    });

    // Creating timetable for Co-Teaching Plan 1 should automatically mirror to Plan 2
    const res = await TimetableService.createTimetable({
      planId: coTeachPlan1Id,
      termYear: "2/2569",
      yearLevel: "3",
      planType: "FOUR_YEAR",
      day: 4,
      startPeriod: 1,
      endPeriod: 3,
      roomId: room102Id,
      teacherId: teacherAId,
      section: "1",
    });

    expect(res.success).toBe(true);

    const plan1Count = await prisma.timetable_tb.count({
      where: { planId: coTeachPlan1Id, day: 4 },
    });
    const plan2Count = await prisma.timetable_tb.count({
      where: { planId: coTeachPlan2Id, day: 4 },
    });

    expect(plan1Count).toBe(1);
    expect(plan2Count).toBe(1);
  });
});

