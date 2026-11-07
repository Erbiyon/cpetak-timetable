import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/timetable/route";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    coTeaching_tb: {
      findFirst: vi.fn(),
    },
    timetable_tb: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    plans_tb: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe("API Route Contract: /api/timetable (POST)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 409 DUPLICATE_SECTION_CONFLICT when same subject and section already exists in same term", async () => {
    (prisma.coTeaching_tb.findFirst as any).mockResolvedValue(null);
    (prisma.timetable_tb.findMany as any)
      .mockResolvedValueOnce([]) // timeConflicts
      .mockResolvedValueOnce([]) // teacherConflicts
      .mockResolvedValueOnce([]); // roomConflicts

    // Current plan
    (prisma.plans_tb.findUnique as any).mockResolvedValueOnce({
      id: 1,
      subjectCode: "CPE101",
      section: "1",
      termYear: "1/2567",
    });

    // Duplicate section found in another plan
    (prisma.plans_tb.findMany as any).mockResolvedValueOnce([
      {
        id: 2,
        subjectCode: "CPE101",
        section: "1",
        termYear: "1/2567",
        planType: "TRANSFER",
        yearLevel: "1",
        timetables: [{ id: 99 }],
      },
    ]);

    const req = new Request("http://localhost:3000/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: 1,
        termYear: "1/2567",
        yearLevel: "1",
        planType: "FOUR_YEAR",
        day: 1,
        startPeriod: 1,
        endPeriod: 3,
        roomId: 10,
        teacherId: 20,
        section: "1",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.conflicts).toBeDefined();
    expect(data.conflicts[0].type).toBe("DUPLICATE_SECTION_CONFLICT");
  });

  it("returns 409 TIME_CONFLICT when time period overlaps with another class of same term/yearLevel/planType", async () => {
    (prisma.coTeaching_tb.findFirst as any).mockResolvedValue(null);
    (prisma.timetable_tb.findMany as any)
      .mockResolvedValueOnce([
        {
          id: 50,
          day: 1,
          startPeriod: 2,
          endPeriod: 4,
          plan: { subjectCode: "CPE102", subjectName: "Programming" },
        },
      ])
      .mockResolvedValueOnce([]) // teacherConflicts
      .mockResolvedValueOnce([]); // roomConflicts

    (prisma.plans_tb.findUnique as any).mockResolvedValueOnce({
      id: 1,
      subjectCode: "CPE101",
      section: "1",
      termYear: "1/2567",
    });
    (prisma.plans_tb.findMany as any).mockResolvedValueOnce([]);

    const req = new Request("http://localhost:3000/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: 1,
        termYear: "1/2567",
        yearLevel: "1",
        planType: "FOUR_YEAR",
        day: 1,
        startPeriod: 1,
        endPeriod: 3,
        roomId: 10,
        teacherId: 20,
        section: "1",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.conflicts).toBeDefined();
    expect(data.conflicts[0].type).toBe("TIME_CONFLICT");
  });

  it("returns 409 TEACHER_CONFLICT when teacher is already teaching in overlapping period", async () => {
    (prisma.coTeaching_tb.findFirst as any).mockResolvedValue(null);
    (prisma.timetable_tb.findMany as any)
      .mockResolvedValueOnce([]) // no timeConflicts
      .mockResolvedValueOnce([
        {
          id: 60,
          planId: 2,
          day: 1,
          startPeriod: 1,
          endPeriod: 3,
          plan: { subjectCode: "CPE200" },
          teacher: { tName: "สมชาย" },
          room: null,
          section: "1",
        },
      ]) // teacherConflicts
      .mockResolvedValueOnce([]); // roomConflicts

    (prisma.plans_tb.findUnique as any).mockResolvedValueOnce({
      id: 1,
      subjectCode: "CPE101",
      section: "1",
      termYear: "1/2567",
    });
    (prisma.plans_tb.findMany as any).mockResolvedValueOnce([]);

    const req = new Request("http://localhost:3000/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: 1,
        termYear: "1/2567",
        yearLevel: "1",
        planType: "FOUR_YEAR",
        day: 1,
        startPeriod: 1,
        endPeriod: 3,
        roomId: 10,
        teacherId: 20,
        section: "1",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.conflicts[0].type).toBe("TEACHER_CONFLICT");
  });
});
