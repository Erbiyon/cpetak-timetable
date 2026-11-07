import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { GET as getDashboardStats } from "@/app/api/dashboard/stats/route";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://root:123456@localhost:3306/timetable_e2e",
    },
  },
});

describe("Dashboard Stats API Characterization Suite (GET /api/dashboard/stats)", () => {
  let testTeacherId: number | null = null;
  let testRoomId: number | null = null;
  let testPlanId: number | null = null;

  beforeAll(async () => {
    // Seed fixtures to ensure predictable non-zero values
    const teacher = await prisma.teacher_tb.create({
      data: {
        tId: "T_STATS_01",
        tName: "StatsTeacher",
        tLastName: "Testing",
        teacherType: "อาจารย์ภายในสาขา",
      },
    });
    testTeacherId = teacher.id;

    const room = await prisma.room_tb.create({
      data: {
        roomCode: "R_STATS_01",
        roomType: "อาคารสาขาวิศวกรรมคอมพิวเตอร์",
        roomCate: "ห้องเรียน",
      },
    });
    testRoomId = room.id;

    const plan = await prisma.plans_tb.create({
      data: {
        subjectCode: "STAT101",
        subjectName: "Dashboard Statistics Testing",
        credit: 3,
        lectureHour: 3,
        labHour: 0,
        planType: "FOUR_YEAR",
        termYear: "1/2569",
        yearLevel: "ปี 1",
      },
    });
    testPlanId = plan.id;
  });

  afterAll(async () => {
    if (testPlanId) {
      await prisma.plans_tb.deleteMany({ where: { id: testPlanId } });
    }
    if (testRoomId) {
      await prisma.room_tb.deleteMany({ where: { id: testRoomId } });
    }
    if (testTeacherId) {
      await prisma.teacher_tb.deleteMany({ where: { id: testTeacherId } });
    }
    await prisma.$disconnect();
  });

  it("returns 200 OK with correct JSON schema and numeric properties", async () => {
    const res = await getDashboardStats();
    expect(res.status).toBe(200);

    const data = await res.json();

    // Verify schema fields and types
    expect(typeof data.totalTeachers).toBe("number");
    expect(typeof data.totalRooms).toBe("number");
    expect(typeof data.totalSubjects).toBe("number");
    expect(typeof data.activePlans).toBe("number");

    expect(data.planBreakdown).toBeDefined();
    expect(typeof data.planBreakdown.transfer).toBe("number");
    expect(typeof data.planBreakdown.fourYear).toBe("number");
    expect(typeof data.planBreakdown.dveLvc).toBe("number");
    expect(typeof data.planBreakdown.dveMsix).toBe("number");

    // Verify mathematical invariant
    const sumBreakdown =
      data.planBreakdown.transfer +
      data.planBreakdown.fourYear +
      data.planBreakdown.dveLvc +
      data.planBreakdown.dveMsix;
    expect(data.activePlans).toBe(sumBreakdown);

    // Verify values reflect seeded data
    expect(data.totalTeachers).toBeGreaterThanOrEqual(1);
    expect(data.totalRooms).toBeGreaterThanOrEqual(1);
    expect(data.totalSubjects).toBeGreaterThanOrEqual(1);
    expect(data.planBreakdown.fourYear).toBeGreaterThanOrEqual(1);
  });
});

